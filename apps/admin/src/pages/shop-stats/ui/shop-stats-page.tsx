import type { Stats } from '@catalog/contract';
import { getStatsOptions } from '@catalog/contract/query';
import { Button, cx, formatAmount } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { BackBar } from '@/shared/ui';

import { changePercent, type StatsPeriod } from '../lib';

import { TopProducts } from './top-products';
import { ViewsChart } from './views-chart';

/**
 * «Магазин → Статистика» (FR-A10; макет AdminPhone2, экран 12): период, просмотры витрины с изменением к прошлому
 * периоду, нажатия «Заказать», просмотры по дням, чаще смотрят. Период — в адресе. Пока грузится другой период,
 * видны прежние числа, приглушённые; не загрузилось — «Повторить». На компьютере макета нет — колонка 560 px.
 */
export function ShopStatsPage({ period, onPeriod }: { period: StatsPeriod; onPeriod: (period: StatsPeriod) => void }) {
  const { t } = useLingui();
  const stats = useQuery({ ...getStatsOptions({ query: { period } }), placeholderData: keepPreviousData });
  const data = stats.data;
  const periods: [StatsPeriod, string][] = [
    ['7d', t`7 дней`],
    ['30d', t`30 дней`],
    ['all', t`Всё время`],
  ];

  return (
    <>
      <BackBar to="/shop">
        <Trans>Статистика</Trans>
      </BackBar>
      <div className="hidden lg:block">
        <div className="text-[14px] text-ink-quiet">
          <Link to="/shop" className="hover:text-ink-night">
            <Trans>Магазин</Trans>
          </Link>{' '}
          / <Trans>Статистика</Trans>
        </div>
        <h1 className="mt-1.5 text-[30px] font-extrabold tracking-[-0.03em]">
          <Trans>Статистика</Trans>
        </h1>
      </div>

      <div className="pb-8 lg:w-[560px]">
        <div role="group" aria-label={t`Период`} className="flex gap-2 px-4 pt-3.5 lg:px-0 lg:pt-[18px]">
          {periods.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={period === value}
              onClick={() => onPeriod(value)}
              className={cx(
                'press inline-flex h-9 items-center rounded-pill px-3.5 text-[14px] font-semibold',
                period === value ? 'bg-ink-night text-white' : 'bg-chip-haze hover:bg-haze-hover',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {data ? (
          <div
            aria-busy={stats.isPlaceholderData}
            className={cx('transition-opacity', stats.isPlaceholderData && 'opacity-60')}
          >
            <div className="grid grid-cols-2 gap-2 px-4 pt-3.5 lg:px-0">
              <Tile
                tone="views"
                value={data.totals.views}
                label={<Trans>просмотров витрины</Trans>}
                sub={<ViewsChange stats={data} />}
              />
              <Tile
                tone="clicks"
                value={data.totals.orderClicks}
                label={<Trans>нажали «Заказать»</Trans>}
                sub={<Trans>переходы в WhatsApp</Trans>}
              />
            </div>
            <ViewsChart byDay={data.byDay} empty={data.totals.views === 0} />
            <TopProducts items={data.topProducts} />
          </div>
        ) : stats.isError ? (
          <div className="mx-4 mt-3.5 rounded-[20px] bg-white p-3.5 text-center shadow-[0_1px_0_#eceaf5] lg:mx-0">
            <p className="text-[14px] text-ink-quiet">
              <Trans>Не получилось загрузить статистику. Проверьте интернет.</Trans>
            </p>
            <Button variant="soft" size="compact" className="mt-3" onClick={() => void stats.refetch()}>
              <Trans>Повторить</Trans>
            </Button>
          </div>
        ) : (
          <div aria-busy="true" aria-label={t`Загрузка`} className="grid grid-cols-2 gap-2 px-4 pt-3.5 lg:px-0">
            <div className="h-[92px] animate-pulse rounded-[20px] bg-chip-haze" />
            <div className="h-[92px] animate-pulse rounded-[20px] bg-chip-haze" />
            <div className="col-span-2 h-40 animate-pulse rounded-[20px] bg-chip-haze" />
          </div>
        )}
      </div>
    </>
  );
}

const tones = {
  views: 'bg-[#ece9ff] text-[#2a2290]',
  clicks: 'bg-mint-soft text-mint-ink',
};

/** Плитка итога (макет: 28 px число, подпись, мелкая строка с прозрачностью 0.8). */
function Tile({
  tone,
  value,
  label,
  sub,
}: {
  tone: keyof typeof tones;
  value: number;
  label: ReactNode;
  sub: ReactNode;
}) {
  return (
    <div className={cx('rounded-[20px] p-3.5', tones[tone])}>
      <div className="text-[28px] font-extrabold tabular-nums">{formatAmount(value)}</div>
      <div className="text-[13px] font-semibold">{label}</div>
      <div className="mt-0.5 text-[12px] opacity-80">{sub}</div>
    </div>
  );
}

/** «+18% к прошлой неделе»; за всё время — «с открытия витрины»; раньше просмотров не было — так и пишем. */
function ViewsChange({ stats }: { stats: Stats }) {
  const previous = stats.previousTotals?.views;
  const change = changePercent(stats.totals.views, previous);
  if (stats.period === 'all') return <Trans>с открытия витрины</Trans>;
  if (change === null)
    return stats.totals.views > 0 ? <Trans>раньше просмотров не было</Trans> : <Trans>пока без просмотров</Trans>;
  const sign = change > 0 ? `+${change}` : change < 0 ? `−${Math.abs(change)}` : '';
  if (stats.period === '7d')
    return change === 0 ? <Trans>как на прошлой неделе</Trans> : <Trans>{sign}% к прошлой неделе</Trans>;
  return change === 0 ? <Trans>как в прошлые 30 дней</Trans> : <Trans>{sign}% к прошлым 30 дням</Trans>;
}
