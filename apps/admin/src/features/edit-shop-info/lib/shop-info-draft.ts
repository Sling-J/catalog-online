import type { Schedule, Shop, ShopUpdate } from '@catalog/contract';
import type { PreviewShopDraft } from '@catalog/contract/preview';

import { closesAfterOpen, isTime, PHONE_DIGITS, WEEKDAYS, type WeekdayKey } from '@/entities/shop';

/** День в форме: выключенный («выходной») помнит часы — включили снова, и они вернулись. */
export type DayDraft = { on: boolean; open: string; close: string };

/** Значения формы «О магазине». WhatsApp — 10 цифр после +7. */
export type ShopInfoDraft = {
  name: string;
  description: string;
  address: string;
  howToFind: string;
  whatsapp: string;
  instagram: string;
  schedule: Record<WeekdayKey, DayDraft>;
};

/** Часы нового рабочего дня, если раньше их не было. */
export const DEFAULT_HOURS = { open: '10:00', close: '20:00' } as const;

export function draftFromShop(shop: Shop): ShopInfoDraft {
  const schedule = Object.fromEntries(
    WEEKDAYS.map((day) => {
      const hours = shop.schedule[day];
      return [day, hours ? { on: true, ...hours } : { on: false, ...DEFAULT_HOURS }];
    }),
  ) as Record<WeekdayKey, DayDraft>;
  return {
    name: shop.name ?? '',
    description: shop.description ?? '',
    address: shop.address ?? '',
    howToFind: shop.howToFind ?? '',
    whatsapp: shop.whatsapp?.replace(/^\+7/, '') ?? '',
    instagram: shop.instagram ?? '',
    schedule,
  };
}

export function scheduleFromDraft(draft: ShopInfoDraft): Schedule {
  return Object.fromEntries(
    WEEKDAYS.map((day) => {
      const { on, open, close } = draft.schedule[day];
      return [day, on ? { open, close } : null];
    }),
  ) as Schedule;
}

const text = (value: string): string | null => value.trim() || null;

/** То, что отправим в `PATCH /shop`, — все поля формы, приведённые к контракту. */
function toUpdate(draft: ShopInfoDraft) {
  return {
    name: draft.name.trim(),
    description: text(draft.description),
    address: text(draft.address),
    howToFind: text(draft.howToFind),
    whatsapp: `+7${draft.whatsapp}`,
    instagram: text(draft.instagram),
    schedule: scheduleFromDraft(draft),
  } satisfies ShopUpdate;
}

/** Только изменённые поля: пустой объект — сохранять нечего. */
export function shopInfoChanges(initial: ShopInfoDraft, draft: ShopInfoDraft): ShopUpdate {
  const before = toUpdate(initial);
  const after = toUpdate(draft);
  return Object.fromEntries(
    Object.entries(after).filter(
      ([key, value]) => JSON.stringify(value) !== JSON.stringify(before[key as keyof typeof before]),
    ),
  );
}

/** Несохранённые правки для превью витрины (`@catalog/contract/preview`): полный набор полей формы. */
export function previewFromDraft(draft: ShopInfoDraft): PreviewShopDraft {
  const { name, whatsapp, ...rest } = toUpdate(draft);
  const preview: PreviewShopDraft = {
    ...rest,
    // день с непонятным временем в превью — как выходной
    schedule: Object.fromEntries(
      WEEKDAYS.map((day) => {
        const { on, open, close } = draft.schedule[day];
        return [day, on && isTime(open) && isTime(close) ? { open, close } : null];
      }),
    ) as Schedule,
  };
  // пустое название и неполный номер витрина не показывает — остаются сохранённые
  if (name) preview.name = name;
  if (draft.whatsapp.length === PHONE_DIGITS) preview.whatsapp = whatsapp;
  return preview;
}

export type ShopInfoError = 'name' | 'whatsapp' | 'time' | 'order';

/** Ошибки по полям; у графика — по дням: «time» (не время) или «order» (закрытие раньше открытия). */
export function validateShopInfo(draft: ShopInfoDraft): {
  name?: ShopInfoError;
  whatsapp?: ShopInfoError;
  days: Partial<Record<WeekdayKey, ShopInfoError>>;
} {
  const days: Partial<Record<WeekdayKey, ShopInfoError>> = {};
  for (const day of WEEKDAYS) {
    const { on, open, close } = draft.schedule[day];
    if (!on) continue;
    if (!isTime(open) || !isTime(close)) days[day] = 'time';
    else if (!closesAfterOpen(open, close)) days[day] = 'order';
  }
  return {
    name: draft.name.trim() ? undefined : 'name',
    whatsapp: draft.whatsapp.length === PHONE_DIGITS ? undefined : 'whatsapp',
    days,
  };
}
