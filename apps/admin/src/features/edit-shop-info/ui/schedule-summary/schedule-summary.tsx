import { cx } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useStore } from '@tanstack/react-form';

import { groupSchedule, shopToday } from '@/entities/shop';

import { useDayNames, useScheduleErrors, type ShopInfoForm } from '../../hooks';
import { scheduleFromDraft } from '../../lib';
import { ScheduleError } from '../schedule-error';

/**
 * «График работы» на телефоне — кратко, подряд идущие дни с одинаковыми часами одной строкой: «Пн–Пт 10:00–20:00»
 * (макет AdminPhone2, экран 9). Сегодня — жирным. «Изменить» открывает шторку с днями.
 */
export function ScheduleSummary({
  form,
  timezone,
  onEdit,
}: {
  form: ShopInfoForm;
  timezone: string;
  onEdit: () => void;
}) {
  const names = useDayNames();
  const errors = useScheduleErrors(form);
  const values = useStore(form.store, (state) => state.values);
  const today = shopToday(timezone);
  const groups = groupSchedule(scheduleFromDraft(values));
  return (
    <section>
      <div className="flex justify-between">
        <h2 className="text-[15px] font-bold">
          <Trans>График работы</Trans>
        </h2>
        <button type="button" onClick={onEdit} className="text-[13px] font-semibold text-iris">
          <Trans>Изменить</Trans>
        </button>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className={cx(
          'mt-1.5 block w-full rounded-2xl border-[1.5px] bg-white px-3.5 text-left',
          Object.keys(errors).length > 0 ? 'border-coral-underside' : 'border-[#e2dff0]',
        )}
      >
        {groups.map(({ days, hours }, index) => {
          const first = days[0]!;
          const last = days.at(-1)!;
          return (
            <span
              key={first}
              className={cx(
                'flex items-center justify-between py-[9px] text-[15px]',
                index > 0 && 'border-t border-[#f0eef7]',
                days.includes(today) && 'font-bold',
              )}
            >
              <span>{days.length === 1 ? names.full[first] : `${names.short[first]}–${names.short[last]}`}</span>
              <span className={cx('tabular-nums', !hours && 'text-ink-muted')}>
                {hours ? `${hours.open}–${hours.close}` : <Trans>Выходной</Trans>}
              </span>
            </span>
          );
        })}
      </button>
      <ScheduleError errors={errors} />
    </section>
  );
}
