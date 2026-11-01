import type { ButtonHTMLAttributes } from 'react';

import { cx } from '../cx.js';

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> & {
  selected?: boolean;
};

/** Чип категории, фильтра или размера. Выбранный — тёмный. */
export function Chip({ selected = false, className, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(
        'inline-flex h-[38px] shrink-0 items-center rounded-pill px-4 font-sans text-[14px] font-semibold',
        'transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-violet',
        selected ? 'bg-ink-night text-white' : 'bg-chip-haze text-ink-night',
        className,
      )}
      {...rest}
    />
  );
}
