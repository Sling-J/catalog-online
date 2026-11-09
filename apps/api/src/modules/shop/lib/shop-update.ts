import type { ShopUpdate } from '@catalog/contract';

import type { FieldError } from '../../../core/errors/index.js';

type Schedule = NonNullable<ShopUpdate['schedule']>;
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/** Поля магазина, которые меняет `PATCH /shop` (без логотипа — он отдельно). */
export type ShopPatch = {
  name?: string;
  subdomain?: string;
  description?: string | null;
  whatsapp?: string;
  instagram?: string | null;
  address?: string | null;
  howToFind?: string | null;
  schedule?: Schedule;
  stockDisplay?: 'levels' | 'exact';
  lowStockThreshold?: number;
  showOutOfStock?: boolean;
  setupCompleted?: boolean;
};

/** Необязательный текст: пробелы по краям убираем, пустая строка — `null` (поле очищено). */
const optionalText = (value: string | null | undefined) => {
  if (value === undefined) return undefined;
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
};

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/** Ошибки графика: закрытие позже открытия; «00:00» в закрытии — до конца дня (как в админке, A27). */
export function scheduleErrors(schedule: Schedule): FieldError[] {
  return DAYS.flatMap((day): FieldError[] => {
    const hours = schedule[day];
    if (!hours || hours.close === '00:00') return [];
    return minutes(hours.close) > minutes(hours.open) ? [] : [{ field: `schedule.${day}.close`, code: 'out_of_range' }];
  });
}

/**
 * Тело `PATCH /shop` (уже прошло схему контракта) → изменения для базы и ошибки по полям.
 * Только переданные поля: `undefined` — не трогать.
 */
export function prepareShopPatch(body: ShopUpdate): { patch: ShopPatch; errors: FieldError[] } {
  const errors: FieldError[] = [];
  const patch: ShopPatch = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (name === '') errors.push({ field: 'name', code: 'required' });
    else patch.name = name;
  }
  if (body.subdomain !== undefined) patch.subdomain = body.subdomain;
  if (body.whatsapp !== undefined) patch.whatsapp = body.whatsapp;
  for (const field of ['description', 'instagram', 'address', 'howToFind'] as const) {
    const value = optionalText(body[field]);
    if (value !== undefined) patch[field] = value;
  }
  if (body.schedule !== undefined) {
    errors.push(...scheduleErrors(body.schedule));
    patch.schedule = body.schedule;
  }
  if (body.stockDisplay !== undefined) patch.stockDisplay = body.stockDisplay;
  if (body.lowStockThreshold !== undefined) patch.lowStockThreshold = body.lowStockThreshold;
  if (body.showOutOfStock !== undefined) patch.showOutOfStock = body.showOutOfStock;
  if (body.setupCompleted !== undefined) patch.setupCompleted = body.setupCompleted;

  return { patch, errors };
}
