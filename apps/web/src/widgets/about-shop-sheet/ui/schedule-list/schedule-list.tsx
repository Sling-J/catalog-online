import type { Schedule } from '@catalog/contract';
import { cx } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import { getOpenStatus, getShopLocalTime, groupSchedule, useNow, useWeekdayLabels } from '@/entities/shop';

/**
 * График по дням: будни одной строкой, сегодняшний день выделен и подписан «открыто».
 * `compact` — панель на компьютере: строки плотнее, без подписи «открыто».
 */
export function ScheduleList({
  schedule,
  timezone,
  compact,
}: {
  schedule: Schedule;
  timezone: string;
  compact?: boolean;
}) {
  const now = useNow();
  const weekdays = useWeekdayLabels();
  const { day: today } = getShopLocalTime(timezone, now);
  const isOpen = getOpenStatus(schedule, timezone, now).kind === 'open';

  return (
    <ul className={cx('text-[14px] leading-normal', compact ? 'mt-4' : 'mt-2')} suppressHydrationWarning>
      {groupSchedule(schedule, today).map((group) => {
        const first = group.days[0]!;
        const last = group.days.at(-1)!;
        const label = group.isToday ? (
          <Trans>Сегодня, {weekdays.long[first].toLowerCase()}</Trans>
        ) : group.days.length > 1 ? (
          `${weekdays.short[first]}–${weekdays.short[last]}`
        ) : (
          weekdays.long[first]
        );
        return (
          <li
            key={first}
            className={cx(
              'flex justify-between gap-3 border-b border-[#f0eef7] last:border-b-0',
              compact ? 'py-[7px]' : 'py-2',
              group.isToday && 'font-bold',
            )}
          >
            <span>{label}</span>
            <span className={cx('tabular-nums', group.isToday && isOpen && 'text-stock-in')}>
              {group.hours ? (
                <>
                  {group.hours.open}–{group.hours.close}
                  {group.isToday && isOpen && !compact && (
                    <>
                      {' '}
                      · <Trans>открыто</Trans>
                    </>
                  )}
                </>
              ) : (
                <Trans>Выходной</Trans>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
