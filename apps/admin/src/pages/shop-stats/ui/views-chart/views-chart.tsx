import type { Stats } from '@catalog/contract';
import { cx, formatAmount } from '@catalog/ui';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { type KeyboardEvent, useRef, useState } from 'react';

import { barHeight, type ChartBar, chartBars, peakIndex, showsLabel, showsValues } from '../../lib';

const FULL = 92; // высота самого большого столбика (макет: 92 из 96)

/**
 * «Просмотры по дням» (макет AdminPhone2, «Статистика»): столбики, выбранный — фиолетовый, остальные сиреневые,
 * под ними дни недели. Сделано сверх макета (решение основателя 2026-11-08, A30): строка выбранного дня под
 * заголовком — дата, просмотры и нажатия «Заказать»; по умолчанию выбран самый высокий столбик, другой выбирают
 * нажатием (наведение только подсвечивает) или стрелками; на неделе — числа над столбиками. За 30 дней — числа месяца под каждым пятым;
 * за всё время больше месяца — по месяцам. Просмотров за период нет — пояснение вместо столбиков.
 */
export function ViewsChart({ byDay, empty }: { byDay: Stats['byDay']; empty: boolean }) {
  const { t } = useLingui();
  const bars = chartBars(byDay);
  const max = Math.max(0, ...bars.map((bar) => bar.views));
  // выбор помним по дате: сменили период — такой даты нет, снова самый высокий
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const found = bars.findIndex((bar) => bar.date === selectedDate);
  const selected = found >= 0 ? found : peakIndex(bars);
  const current = bars[selected];
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const byMonth = bars[0]?.unit === 'month';
  const dense = bars.length > 12;
  const values = showsValues(bars.length);
  const weekdays = [t`Вс`, t`Пн`, t`Вт`, t`Ср`, t`Чт`, t`Пт`, t`Сб`];
  const months = [t`янв`, t`фев`, t`мар`, t`апр`, t`май`, t`июн`, t`июл`, t`авг`, t`сен`, t`окт`, t`ноя`, t`дек`];
  const date = (bar: ChartBar) => new Date(`${bar.date}T00:00:00Z`);
  const label = (bar: ChartBar) => {
    const day = date(bar);
    if (bar.unit === 'month') return months[day.getUTCMonth()]!;
    return bars.length <= 7 ? weekdays[day.getUTCDay()]! : String(day.getUTCDate());
  };
  const full = (bar: ChartBar) => {
    const day = date(bar);
    return bar.unit === 'month'
      ? `${months[day.getUTCMonth()]} ${day.getUTCFullYear()}`
      : `${weekdays[day.getUTCDay()]}, ${day.getUTCDate()} ${months[day.getUTCMonth()]}`;
  };
  const select = (index: number, focus = false) => {
    const bar = bars[index];
    if (!bar) return;
    setSelectedDate(bar.date);
    if (focus) refs.current[index]?.focus();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    const edge = { Home: 0, End: bars.length - 1 }[event.key];
    if (step === undefined && edge === undefined) return;
    event.preventDefault();
    select(edge ?? Math.min(bars.length - 1, Math.max(0, selected + step!)), true);
  };

  return (
    <div className="mx-4 mt-2.5 rounded-[20px] bg-white p-3.5 shadow-[0_1px_0_#eceaf5] lg:mx-0">
      <h2 className="text-[15px] font-bold">
        {byMonth ? <Trans>Просмотры по месяцам</Trans> : <Trans>Просмотры по дням</Trans>}
      </h2>
      {empty || !current ? (
        <p className="mt-3 flex h-[114px] items-center text-[14px] leading-[1.45] text-ink-quiet">
          <Trans>
            За этот период просмотров нет. Поделитесь ссылкой на витрину — в WhatsApp, Instagram или профиле 2ГИС.
          </Trans>
        </p>
      ) : (
        <>
          <p aria-live="polite" className="mt-0.5 truncate text-[13px] text-ink-quiet">
            <span className="font-semibold text-ink-night">{full(current)}</span> ·{' '}
            <Plural value={current.views} one="# просмотр" few="# просмотра" other="# просмотров" /> ·{' '}
            <Plural
              value={current.orderClicks}
              _0="без нажатий «Заказать»"
              one="# нажатие «Заказать»"
              few="# нажатия «Заказать»"
              other="# нажатий «Заказать»"
            />
          </p>
          <div
            role="group"
            aria-label={t`Выберите день`}
            onKeyDown={onKeyDown}
            className={cx('mt-3 flex items-end', values ? 'h-[112px]' : 'h-24', dense ? 'gap-1' : 'gap-2.5')}
          >
            {bars.map((bar, index) => {
              const on = index === selected;
              return (
                <button
                  key={bar.date}
                  ref={(element) => {
                    refs.current[index] = element;
                  }}
                  type="button"
                  tabIndex={on ? 0 : -1}
                  aria-pressed={on}
                  aria-label={`${full(bar)}: ${formatAmount(bar.views)}`}
                  onClick={() => select(index)}
                  className="group flex h-full flex-1 flex-col items-center justify-end gap-1 outline-none"
                >
                  {values && (
                    <span
                      aria-hidden="true"
                      className={cx('text-[11px] font-semibold tabular-nums', on ? 'text-iris' : 'text-ink-muted')}
                    >
                      {formatAmount(bar.views)}
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className={cx(
                      'w-full transition-colors group-focus-visible:outline-3 group-focus-visible:outline-offset-2 group-focus-visible:outline-iris',
                      dense ? 'rounded-[4px_4px_2px_2px]' : 'rounded-[8px_8px_4px_4px]',
                      on ? 'bg-iris' : 'bg-lilac-field group-hover:bg-[#b6a5ff]',
                    )}
                    style={{ height: barHeight(bar.views, max, FULL) }}
                  />
                </button>
              );
            })}
          </div>
          <div aria-hidden="true" className={cx('mt-1.5 flex text-[11px] text-ink-muted', dense ? 'gap-1' : 'gap-2.5')}>
            {bars.map((bar, index) => (
              <span
                key={bar.date}
                className={cx(
                  'flex-1 text-center whitespace-nowrap',
                  index === selected && 'font-semibold text-ink-night',
                )}
              >
                {showsLabel(index, bars.length) ? label(bar) : ''}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
