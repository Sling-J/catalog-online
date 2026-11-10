import type {
  Attribute,
  CreateAttributeData,
  ReplaceAttributeValuesData,
  UpdateAttributeData,
} from '@catalog/contract';
import { Injectable } from '@nestjs/common';

import { InjectDb, isUniqueViolation, type Db, type DbOrTx } from '../../core/db/index.js';
import { AppError } from '../../core/errors/index.js';
import { attributesRepository, type AttributeRow, type ValueWithUsage } from './attributes.repository.js';
import { checkValues, uniqueValues } from './lib/values.js';

/** Пара «свойство — значение текстом», как в строке таблицы размеров. */
export type ValueRef = { attributeId: string; value: string };

const valueKey = (attributeId: string, value: string) => `${attributeId}:${value.toLowerCase()}`;

/**
 * Свойства вариантов (FR-A6, D4): имя уникально в магазине, значение — в свойстве (без учёта регистра); значение,
 * которое стоит у вариантов, удалить нельзя; удаление свойства снимает его значения с вариантов (решение основателя
 * 2026-11-09, T-408: даже если варианты товара после этого совпадут — повтор покажет таблица размеров).
 */
@Injectable()
export class AttributesService {
  constructor(@InjectDb() private readonly db: Db) {}

  async list(shopId: string, db: DbOrTx = this.db): Promise<Attribute[]> {
    const [rows, values] = await Promise.all([
      attributesRepository.list(db, shopId),
      attributesRepository.valuesWithUsage(db, shopId),
    ]);
    return rows.map((row) => toAttribute(row, values));
  }

  async create(shopId: string, body: CreateAttributeData['body']): Promise<Attribute> {
    const name = requireName(body.name);
    const id = await this.writing(() =>
      this.db.transaction(async (tx) => {
        await attributesRepository.lock(tx, shopId);
        const created = await attributesRepository.insert(tx, shopId, {
          name,
          inFilters: body.inFilters ?? true,
          position: await attributesRepository.count(tx, shopId),
        });
        await attributesRepository.insertValues(
          tx,
          shopId,
          uniqueValues(body.values ?? []).map((value, position) => ({ attributeId: created.id, value, position })),
        );
        return created.id;
      }),
    );
    return this.get(shopId, id);
  }

  async update(shopId: string, attributeId: string, body: UpdateAttributeData['body']): Promise<Attribute> {
    const patch: Partial<Pick<AttributeRow, 'name' | 'inFilters'>> = {};
    if (body.name !== undefined) patch.name = requireName(body.name);
    if (body.inFilters !== undefined) patch.inFilters = body.inFilters;
    await this.writing(async () => {
      const attribute = await attributesRepository.find(this.db, shopId, attributeId);
      if (!attribute) throw new AppError('not_found', 404);
      if (Object.keys(patch).length) await attributesRepository.update(this.db, shopId, attributeId, patch);
    });
    return this.get(shopId, attributeId);
  }

  async delete(shopId: string, attributeId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await attributesRepository.lock(tx, shopId);
      if (!(await attributesRepository.delete(tx, shopId, attributeId))) throw new AppError('not_found', 404);
      // остальные свойства — снова подряд
      for (const [position, row] of (await attributesRepository.list(tx, shopId)).entries()) {
        if (row.position !== position) await attributesRepository.update(tx, shopId, row.id, { position });
      }
    });
  }

  /** Значения и их порядок целиком: с id — переименовать и переставить, без id — добавить, остальные — удалить. */
  async replaceValues(
    shopId: string,
    attributeId: string,
    input: ReplaceAttributeValuesData['body']['values'],
  ): Promise<Attribute> {
    await this.db.transaction(async (tx) => {
      await attributesRepository.lock(tx, shopId);
      const attribute = await attributesRepository.find(tx, shopId, attributeId);
      if (!attribute) throw new AppError('not_found', 404);
      const current = await attributesRepository.valuesWithUsage(tx, shopId, [attributeId]);
      const byId = new Map(current.map((value) => [value.id, value]));
      const checked = checkValues(input, new Set(byId.keys()));
      if (checked.kind === 'invalid') throw new AppError('validation_failed', 422, { errors: checked.errors });
      if (checked.kind === 'taken') throw new AppError('attribute_value_taken', 409, { errors: checked.errors });

      const kept = new Set(checked.values.flatMap((value) => value.id ?? []));
      const removed = current.filter((value) => !kept.has(value.id));
      if (removed.some((value) => value.usageCount > 0)) throw new AppError('attribute_value_in_use', 409);

      await attributesRepository.deleteValues(
        tx,
        shopId,
        removed.map((value) => value.id),
      );
      const renamed = checked.values.filter((value) => value.id && byId.get(value.id)!.value !== value.value);
      await attributesRepository.parkValues(
        tx,
        shopId,
        renamed.map((value) => value.id!),
      );
      const created: { attributeId: string; value: string; position: number }[] = [];
      for (const [position, value] of checked.values.entries()) {
        if (!value.id) {
          created.push({ attributeId, value: value.value, position });
          continue;
        }
        const before = byId.get(value.id)!;
        if (before.value !== value.value || before.position !== position) {
          await attributesRepository.updateValue(tx, shopId, value.id, { value: value.value, position });
        }
      }
      await attributesRepository.insertValues(tx, shopId, created);
    });
    return this.get(shopId, attributeId);
  }

  // ───────── для таблицы размеров товара (модуль products) ─────────

  /** Какие из свойств есть у магазина. */
  async existing(shopId: string, attributeIds: string[], tx?: DbOrTx): Promise<Set<string>> {
    return new Set(await attributesRepository.existing(tx ?? this.db, shopId, [...new Set(attributeIds)]));
  }

  /**
   * Свойства по именам из файла импорта (без учёта регистра); недостающие создаются в конце списка — в фильтрах
   * витрины или нет, как скажет импорт (`inFilters`). У существующих свойств ничего не меняется. Возвращает id по
   * имени в нижнем регистре. Внутри транзакции импорта.
   */
  async ensureByNames(
    shopId: string,
    items: { name: string; inFilters: boolean }[],
    tx: DbOrTx,
  ): Promise<Map<string, string>> {
    await attributesRepository.lock(tx, shopId);
    const rows = await attributesRepository.list(tx, shopId);
    const ids = new Map(rows.map((row) => [row.name.toLowerCase(), row.id]));
    let position = rows.length;
    for (const { name, inFilters } of items) {
      if (ids.has(name.toLowerCase())) continue;
      const created = await attributesRepository.insert(tx, shopId, { name, inFilters, position: position++ });
      ids.set(name.toLowerCase(), created.id);
    }
    return ids;
  }

  /**
   * Id значений по тексту для каждой строки (без учёта регистра); значения, которого нет («Свой размер»), создаётся
   * в конце свойства. Свойства должны существовать (`existing`). Внутри транзакции изменения товара.
   */
  async resolveValues(shopId: string, rows: ValueRef[][], tx: DbOrTx): Promise<string[][]> {
    const attributeIds = [...new Set(rows.flat().map((item) => item.attributeId))];
    if (attributeIds.length === 0) return rows.map(() => []);
    await attributesRepository.lock(tx, shopId);
    const load = async () =>
      new Map(
        (await attributesRepository.values(tx, shopId, attributeIds)).map((value) => [
          valueKey(value.attributeId, value.value),
          value,
        ]),
      );
    let values = await load();
    const nextPosition = new Map<string, number>();
    for (const value of values.values()) {
      nextPosition.set(value.attributeId, Math.max(nextPosition.get(value.attributeId) ?? 0, value.position + 1));
    }
    const toCreate = new Map<string, { attributeId: string; value: string; position: number }>();
    for (const item of rows.flat()) {
      const key = valueKey(item.attributeId, item.value);
      if (values.has(key) || toCreate.has(key)) continue;
      const position = nextPosition.get(item.attributeId) ?? 0;
      nextPosition.set(item.attributeId, position + 1);
      toCreate.set(key, { attributeId: item.attributeId, value: item.value, position });
    }
    if (toCreate.size) {
      await attributesRepository.insertValues(tx, shopId, [...toCreate.values()]);
      values = await load();
    }
    return rows.map((row) => row.map((item) => values.get(valueKey(item.attributeId, item.value))!.id));
  }

  private async get(shopId: string, attributeId: string): Promise<Attribute> {
    const attribute = await attributesRepository.find(this.db, shopId, attributeId);
    if (!attribute) throw new AppError('not_found', 404);
    return toAttribute(attribute, await attributesRepository.valuesWithUsage(this.db, shopId, [attributeId]));
  }

  /** Повтор имени свойства (в том числе параллельный) — 409 `attribute_name_taken`. */
  private async writing<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (isUniqueViolation(error)) throw new AppError('attribute_name_taken', 409);
      throw error;
    }
  }
}

function toAttribute(row: AttributeRow, values: ValueWithUsage[]): Attribute {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    inFilters: row.inFilters,
    values: values
      .filter((value) => value.attributeId === row.id)
      .map((value) => ({ id: value.id, value: value.value, position: value.position, usageCount: value.usageCount })),
  };
}

function requireName(value: string): string {
  const name = value.trim();
  if (!name) throw new AppError('validation_failed', 422, { errors: [{ field: 'name', code: 'required' }] });
  return name;
}
