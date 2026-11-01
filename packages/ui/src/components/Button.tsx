import type { ButtonHTMLAttributes } from 'react';

import { cx } from '../cx.js';

export type ButtonVariant = 'primary' | 'dark' | 'confirm' | 'soft' | 'line';
export type ButtonSize = 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Растянуть на всю ширину — главная кнопка на телефоне. */
  block?: boolean;
};

// Пухлые кнопки с подложкой: при нажатии кнопка «проседает» на подложку (Press Rule).
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-sun text-ink-night shadow-press-sun',
  dark: 'bg-ink-night text-white shadow-press-ink',
  confirm: 'bg-mint text-mint-ink shadow-press-mint',
  soft: 'bg-chip-haze text-ink-night',
  line: 'bg-white text-ink-night ring-[1.5px] ring-inset ring-[#dad6ec]',
};

const sizes: Record<ButtonSize, string> = {
  md: 'h-11 px-[18px] text-label',
  lg: 'h-[54px] px-6 text-label',
};

export function Button({ variant = 'dark', size = 'lg', block, className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-pill font-sans font-semibold whitespace-nowrap',
        'transition-transform duration-200 ease-press active:translate-y-[3px] active:shadow-none',
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-violet',
        'disabled:pointer-events-none disabled:bg-chip-haze disabled:text-ink-muted disabled:shadow-none',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    />
  );
}
