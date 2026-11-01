import type { Schedule } from '@catalog/contract';
import { cx } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import { useNow, useWeekdayLabels } from '@/entities/shop/hooks';
import { getOpenStatus } from '@/entities/shop/lib';

/** «Открыто до 20:00» или «Откроется завтра в 10:00». Часы считаются по часовому поясу магазина. */
export function OpenStatus({
  schedule,
  timezone,
  className,
}: {
  schedule: Schedule;
  timezone: string;
  className?: string;
}) {
  const now = useNow();
  const weekdays = useWeekdayLabels();
  const status = getOpenStatus(schedule, timezone, now);

  return (
    // время на сервере и в браузере может разойтись на минуту — это не ошибка
    <span
      suppressHydrationWarning
      className={cx(status.kind === 'open' ? 'font-semibold text-stock-in' : '', className)}
    >
      {status.kind === 'open' ? (
        <Trans>Открыто до {status.closesAt}</Trans>
      ) : !status.next ? (
        <Trans>Закрыто</Trans>
      ) : status.next.daysAhead === 0 ? (
        <Trans>Откроется в {status.next.time}</Trans>
      ) : status.next.daysAhead === 1 ? (
        <Trans>Откроется завтра в {status.next.time}</Trans>
      ) : (
        <Trans>
          Откроется {weekdays.on[status.next.day]} в {status.next.time}
        </Trans>
      )}
    </span>
  );
}
