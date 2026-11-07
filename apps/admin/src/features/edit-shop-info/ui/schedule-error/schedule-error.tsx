import { Trans } from '@lingui/react/macro';

import type { WeekdayKey } from '@/entities/shop';

import type { ShopInfoError } from '../../lib';

/** Подпись под графиком, когда время у какого-то дня не годится (сами дни подсвечены). */
export function ScheduleError({
  errors,
  className,
}: {
  errors: Partial<Record<WeekdayKey, ShopInfoError>>;
  className?: string;
}) {
  const kinds = Object.values(errors);
  if (kinds.length === 0) return null;
  return (
    <p role="alert" className={className ?? 'mt-2 text-[13px] text-coral-underside'}>
      {kinds.includes('time') ? (
        <Trans>Время — в формате 10:00</Trans>
      ) : (
        <Trans>Закрытие должно быть позже открытия</Trans>
      )}
    </p>
  );
}
