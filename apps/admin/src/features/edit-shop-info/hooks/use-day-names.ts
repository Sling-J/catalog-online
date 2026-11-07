import { useLingui } from '@lingui/react/macro';

import type { WeekdayKey } from '@/entities/shop';

/** Названия дней: полные — в графике, короткие — в диапазоне «Пн–Пт». */
export function useDayNames() {
  const { t } = useLingui();
  const full: Record<WeekdayKey, string> = {
    mon: t`Понедельник`,
    tue: t`Вторник`,
    wed: t`Среда`,
    thu: t`Четверг`,
    fri: t`Пятница`,
    sat: t`Суббота`,
    sun: t`Воскресенье`,
  };
  const short: Record<WeekdayKey, string> = {
    mon: t`Пн`,
    tue: t`Вт`,
    wed: t`Ср`,
    thu: t`Чт`,
    fri: t`Пт`,
    sat: t`Сб`,
    sun: t`Вс`,
  };
  return { full, short };
}
