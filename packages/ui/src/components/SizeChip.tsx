import type { ButtonHTMLAttributes } from 'react';

import { cx } from '../cx.js';

export type SizeChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> & {
  selected?: boolean;
  /** Нет в наличии: пунктирная рамка и зачёркнутое значение. */
  out?: boolean;
  /** sm — строка фильтров на компьютере; md — карточка товара и шторка фильтров; на компьютере md чуть крупнее. */
  size?: 'sm' | 'md';
};

const sizes = {
  sm: 'h-9 min-w-11 rounded-xl px-2.5 text-[13px]',
  md: 'h-[46px] min-w-14 rounded-field px-3.5 text-[15px] lg:h-12 lg:min-w-[58px]',
};

/** Квадратный чип значения: размер, рост. Выбранный — тёмный, отсутствующий — пунктиром (макет витрины V6). */
export function SizeChip({
  selected = false,
  out = false,
  size = 'md',
  className,
  type = 'button',
  ...rest
}: SizeChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(
        'inline-flex shrink-0 items-center justify-center border-[1.5px] font-sans font-semibold tabular-nums',
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris',
        sizes[size],
        selected
          ? 'border-ink-night bg-ink-night text-white hover:border-ink-hover hover:bg-ink-hover'
          : out
            ? 'cursor-default border-dashed border-[#d6d2e8] bg-transparent text-stock-out line-through'
            : 'border-line bg-white text-ink-night hover:border-line-hover',
        className,
      )}
      {...rest}
    />
  );
}
