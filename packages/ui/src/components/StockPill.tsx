import { Trans } from '@lingui/react/macro';

import { cx } from '../cx.js';

export type StockLevel = 'in' | 'low' | 'out';

export type StockPillProps = {
  level: StockLevel;
  /** Точное количество — когда магазин показывает число (D5). */
  quantity?: number | null;
  className?: string;
};

const tones: Record<StockLevel, string> = {
  in: 'bg-[#e6fbf2] text-stock-in',
  low: 'bg-[#fff1d6] text-stock-low',
  out: 'bg-chip-haze text-stock-out',
};

/** Наличие варианта. Цвета наличия — только для статуса (Status Is Sacred). */
export function StockPill({ level, quantity, className }: StockPillProps) {
  const hasQuantity = typeof quantity === 'number';
  return (
    <span
      className={cx(
        'inline-flex h-[26px] items-center gap-1.5 rounded-pill px-2.5 font-sans text-[12px] font-bold whitespace-nowrap',
        tones[level],
        className,
      )}
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
      {level === 'out' ? (
        <Trans>Нет в наличии</Trans>
      ) : level === 'low' ? (
        hasQuantity ? (
          <Trans>Осталось {quantity} шт.</Trans>
        ) : (
          <Trans>Осталось мало</Trans>
        )
      ) : hasQuantity ? (
        <Trans>В наличии: {quantity} шт.</Trans>
      ) : (
        <Trans>В наличии</Trans>
      )}
    </span>
  );
}
