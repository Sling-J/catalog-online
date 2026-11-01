import { useLingui } from '@lingui/react/macro';

import type { WeekdayKey } from '@/entities/shop/lib';

type Labels = Record<WeekdayKey, string>;

/** Названия дней недели: короткие («Пн»), полные («Понедельник») и «в понедельник». */
export function useWeekdayLabels(): { short: Labels; long: Labels; on: Labels } {
  const { t } = useLingui();
  return {
    short: { mon: t`Пн`, tue: t`Вт`, wed: t`Ср`, thu: t`Чт`, fri: t`Пт`, sat: t`Сб`, sun: t`Вс` },
    long: {
      mon: t`Понедельник`,
      tue: t`Вторник`,
      wed: t`Среда`,
      thu: t`Четверг`,
      fri: t`Пятница`,
      sat: t`Суббота`,
      sun: t`Воскресенье`,
    },
    on: {
      mon: t`в понедельник`,
      tue: t`во вторник`,
      wed: t`в среду`,
      thu: t`в четверг`,
      fri: t`в пятницу`,
      sat: t`в субботу`,
      sun: t`в воскресенье`,
    },
  };
}
