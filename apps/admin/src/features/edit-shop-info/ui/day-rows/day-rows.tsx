import { cx, Switch } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';

import { shopToday, WEEKDAYS } from '@/entities/shop';

import { useDayNames, useScheduleErrors, type ShopInfoForm } from '../../hooks';
import { DEFAULT_HOURS } from '../../lib';
import { ScheduleError } from '../schedule-error';
import { TimeInput } from '../time-input';

/**
 * Дни недели с часами и переключателем «рабочий» — ровной сеткой (макет AdminDesk2, экран 7): день, открытие, тире,
 * закрытие, переключатель. Выходной — «Выходной» на месте часов. Сегодня (по часовому поясу магазина) — жирным.
 * Под днями — «Скопировать Пн на все будни». `grid` — колонки сетки: на компьютере шире, в шторке телефона уже.
 */
export function DayRows({ form, timezone, grid }: { form: ShopInfoForm; timezone: string; grid: string }) {
  const { t } = useLingui();
  const names = useDayNames();
  const errors = useScheduleErrors(form);
  const today = shopToday(timezone);
  return (
    <form.Field name="schedule">
      {(field) => {
        const schedule = field.state.value;
        const copyMonday = () =>
          field.handleChange({
            ...schedule,
            tue: { ...schedule.mon },
            wed: { ...schedule.mon },
            thu: { ...schedule.mon },
            fri: { ...schedule.mon },
          });
        return (
          <>
            <div
              className="grid gap-2.5 pt-1 pb-1.5 text-[12px] font-semibold text-ink-quiet max-lg:gap-2"
              style={{ gridTemplateColumns: grid }}
            >
              <span>
                <Trans>День</Trans>
              </span>
              <span className="text-center">
                <Trans>Открытие</Trans>
              </span>
              <span />
              <span className="text-center">
                <Trans>Закрытие</Trans>
              </span>
              <span>
                <Trans>Раб.</Trans>
              </span>
            </div>
            {WEEKDAYS.map((day) => {
              const hours = schedule[day];
              const set = (patch: Partial<typeof hours>) =>
                field.handleChange({ ...schedule, [day]: { ...hours, ...patch } });
              const invalid = errors[day] !== undefined;
              return (
                <div
                  key={day}
                  className={cx(
                    'grid items-center gap-2.5 py-1.5 text-[15px] max-lg:gap-2',
                    day === today && 'font-bold',
                  )}
                  style={{ gridTemplateColumns: grid }}
                >
                  <span className="truncate">{names.full[day]}</span>
                  {hours.on ? (
                    <>
                      <TimeInput
                        value={hours.open}
                        label={t`${names.full[day]}, открытие`}
                        invalid={invalid}
                        onChange={(open) => set({ open })}
                      />
                      <span className="text-center text-ink-muted">—</span>
                      <TimeInput
                        value={hours.close}
                        label={t`${names.full[day]}, закрытие`}
                        invalid={invalid}
                        onChange={(close) => set({ close })}
                      />
                    </>
                  ) : (
                    <span className="col-span-3 flex h-10 items-center justify-center rounded-xl bg-[#f6f5fb] text-[14px] font-normal text-ink-muted">
                      <Trans>Выходной</Trans>
                    </span>
                  )}
                  <Switch
                    checked={hours.on}
                    onCheckedChange={(on) =>
                      // включили день без часов — ставим обычные
                      set(on && !hours.open && !hours.close ? { on, ...DEFAULT_HOURS } : { on })
                    }
                    label={<span className="sr-only">{t`${names.full[day]} — рабочий день`}</span>}
                    className="w-auto gap-0"
                  />
                </div>
              );
            })}
            <ScheduleError errors={errors} />
            <button
              type="button"
              onClick={copyMonday}
              className="pt-2.5 pb-1 text-[13px] font-semibold text-iris hover:underline"
            >
              <Trans>Скопировать Пн на все будни</Trans>
            </button>
          </>
        );
      }}
    </form.Field>
  );
}
