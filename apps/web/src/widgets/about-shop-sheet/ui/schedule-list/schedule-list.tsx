import type { Schedule } from '@catalog/contract';
import { cx } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import { getOpenStatus, getShopLocalTime, groupSchedule, useNow, useWeekdayLabels } from '@/entities/shop';

/** График по дням: будни одной строкой, сегодняшний день выделен и подписан «открыто». */
export function ScheduleList({ schedule, timezone }: { schedule: Schedule; timezone: string }) {
  const now = useNow();
  const weekdays = useWeekdayLabels();
  const { day: today } = getShopLocalTime(timezone, now);
  const isOpen = getOpenStatus(schedule, timezone, now).kind === 'open';

  return (
    <ul className="mt-2 text-[14px] leading-normal" suppressHydrationWarning>
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
              'flex justify-between gap-3 border-b border-[#f0eef7] py-2 last:border-b-0',
              group.isToday && 'font-bold',
            )}
          >
            <span>{label}</span>
            <span className={cx('tabular-nums', group.isToday && isOpen && 'text-stock-in')}>
              {group.hours ? (
                <>
                  {group.hours.open}–{group.hours.close}
                  {group.isToday && isOpen && (
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
