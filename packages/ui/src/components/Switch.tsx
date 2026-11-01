import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cx } from '../cx.js';

export type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role' | 'aria-checked'> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
};

/** Переключатель «да / нет»: «Показывать на витрине», «Только в наличии». */
export function Switch({ checked, onCheckedChange, label, className, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cx(
        'inline-flex w-full items-center justify-between gap-3 font-sans text-label text-ink-night',
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris',
        className,
      )}
      {...rest}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={cx(
          'relative h-7 w-[46px] shrink-0 rounded-pill transition-colors duration-200',
          checked ? 'bg-stock-in' : 'bg-[#dcd8ee]',
        )}
      >
        <span
          className={cx(
            'absolute top-[3px] size-[22px] rounded-full bg-white shadow-[0_2px_4px_rgb(0_0_0/0.15)] transition-[left] duration-200',
            checked ? 'left-[21px]' : 'left-[3px]',
          )}
        />
      </span>
    </button>
  );
}
