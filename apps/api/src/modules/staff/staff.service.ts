import type {
  StaffImpersonateShopResponse,
  StaffListShopsData,
  StaffListShopsResponse,
  StaffMeResponse,
} from '@catalog/contract';
import { Injectable } from '@nestjs/common';

import {
  hashToken,
  newToken,
  normalizeEmail,
  StaffSessionService,
  verifyAgainstDummy,
  verifyPassword,
} from '../../core/auth/index.js';
import { AppConfig } from '../../core/config/index.js';
import { InjectDb, type Db } from '../../core/db/index.js';
import { AppError } from '../../core/errors/index.js';
import { decodeCursor, encodeCursor } from '../../core/pagination/index.js';
import { staffRepository } from './staff.repository.js';

const DEFAULT_LIMIT = 30;
const LIST_SORT = 'new';
/** Ссылка входа «от имени» живёт минуту: её сразу открывает суперадминка (ADR 0005). */
export const IMPERSONATION_LINK_TTL_MS = 60_000;

/**
 * Суперадминка (FR-S1–S3, D15): вход сотрудника, список магазинов, блокировка и вход «от имени». Блокировка,
 * разблокировка и вход «от имени» пишутся в журнал `audit_log` в той же транзакции.
 */
@Injectable()
export class StaffService {
  constructor(
    @InjectDb() private readonly db: Db,
    private readonly staffSessions: StaffSessionService,
    private readonly config: AppConfig,
  ) {}

  /** Неверная почта или пароль — одинаковый 401 за одинаковое время. */
  async login(input: { email: string; password: string }): Promise<void> {
    const staff = await staffRepository.findStaffByEmail(this.db, normalizeEmail(input.email));
    const valid = staff
      ? await verifyPassword(staff.passwordHash, input.password)
      : await verifyAgainstDummy(input.password);
    if (!staff || !valid) throw new AppError('unauthorized', 401);
    await this.staffSessions.start(staff.id);
  }

  logout(): Promise<void> {
    return this.staffSessions.end();
  }

  async me(staffId: string): Promise<StaffMeResponse> {
    const email = await staffRepository.findStaffEmail(this.db, staffId);
    if (!email) throw new AppError('unauthorized', 401);
    return { email };
  }

  async listShops(query: NonNullable<StaffListShopsData['query']>): Promise<StaffListShopsResponse> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const cursor = query.cursor ? decodeCursor(query.cursor, LIST_SORT) : null;
    const rows = await staffRepository.listShops(this.db, query.q, cursor, limit);
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map(({ sortKey: _sortKey, email, createdAt, ...row }) => ({
        ...row,
        ...(email ? { email } : {}),
        createdAt: createdAt.toISOString(),
      })),
      nextCursor:
        rows.length > limit && last ? encodeCursor({ sort: LIST_SORT, key: last.sortKey, id: last.id }) : null,
    };
  }

  /**
   * Блокировка (FR-S2): витрина отвечает 410 `shop_blocked`, владелец входит в админку и видит статус. Сессии
   * магазина не закрываются (решение основателя 2026-11-10). Прежний статус — в журнал, его вернёт разблокировка.
   * Уже заблокирован — без изменений.
   */
  async block(staffId: string, shopId: string, reason: string | undefined): Promise<void> {
    await this.db.transaction(async (tx) => {
      const shop = await staffRepository.findShopForUpdate(tx, shopId);
      if (!shop) throw new AppError('not_found', 404);
      if (shop.status === 'blocked') return;
      await staffRepository.setStatus(tx, shopId, 'blocked');
      const trimmed = reason?.trim();
      await staffRepository.audit(tx, {
        staffUserId: staffId,
        shopId,
        action: 'block',
        payload: { previousStatus: shop.status, ...(trimmed ? { reason: trimmed } : {}) },
      });
    });
  }

  /** Разблокировка: статус, который был до блокировки (нет в журнале — черновик). Не заблокирован — без изменений. */
  async unblock(staffId: string, shopId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const shop = await staffRepository.findShopForUpdate(tx, shopId);
      if (!shop) throw new AppError('not_found', 404);
      if (shop.status !== 'blocked') return;
      const status = (await staffRepository.statusBeforeBlock(tx, shopId)) ?? 'draft';
      await staffRepository.setStatus(tx, shopId, status);
      await staffRepository.audit(tx, { staffUserId: staffId, shopId, action: 'unblock', payload: { status } });
    });
  }

  /**
   * Вход «от имени» (FR-S3, ADR 0005): ссылка в админку с одноразовым токеном во фрагменте; админка обменяет его на
   * сессию `sid` с отметкой сотрудника (`AuthService.startImpersonation`: 2 часа без продления, смена пароля и письма
   * владельцу запрещены). Заблокированный магазин тоже можно открыть — для поддержки. В журнал — выдача ссылки.
   */
  async impersonate(staffId: string, shopId: string): Promise<StaffImpersonateShopResponse> {
    const token = newToken();
    await this.db.transaction(async (tx) => {
      const shop = await staffRepository.findShopForUpdate(tx, shopId);
      if (!shop?.accountId) throw new AppError('not_found', 404);
      await staffRepository.createImpersonationToken(tx, {
        accountId: shop.accountId,
        staffUserId: staffId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + IMPERSONATION_LINK_TTL_MS),
      });
      await staffRepository.audit(tx, { staffUserId: staffId, shopId, action: 'impersonate' });
    });
    return { url: `${this.config.get('adminUrl')}/impersonate#${token}` };
  }
}
