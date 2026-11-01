import type { ButtonHTMLAttributes } from 'react';

import { cx } from '../cx.js';

export type ButtonVariant = 'primary' | 'dark' | 'confirm' | 'soft' | 'line';
/**
 * md — 44 px; state — кнопки пустых и служебных состояний (50 px, на компьютере 52);
 * lg — кнопки в шторках (54 px); cta — главная кнопка карточки товара (56 px, на компьютере 58).
 */
export type ButtonSize = 'md' | 'state' | 'lg' | 'cta';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Растянуть на всю ширину — главная кнопка на телефоне. */
  block?: boolean;
  /** Без подложки — тёмные кнопки внутри шторок (макет витрины V6). */
  flat?: boolean;
};

// Пухлые кнопки с подложкой: при нажатии кнопка «проседает» на подложку (Press Rule).
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-sun text-ink-night hover:bg-sun-hover',
  dark: 'bg-ink-night text-white hover:bg-ink-hover',
  confirm: 'bg-mint text-mint-ink hover:bg-mint-hover',
  soft: 'bg-chip-haze text-ink-night hover:bg-haze-hover',
  line: 'bg-white text-ink-night ring-[1.5px] ring-line ring-inset hover:ring-line-hover',
};

const press: Partial<Record<ButtonVariant, string>> = {
  primary: 'shadow-press-sun',
  dark: 'shadow-press-ink',
  confirm: 'shadow-press-mint',
};

// у главной кнопки карточки товара подложка толще — 5 px
const pressCta: Partial<Record<ButtonVariant, string>> = {
  primary: 'shadow-[0_5px_0_var(--color-sun-underside)]',
  dark: 'shadow-[0_5px_0_var(--color-ink-underside)]',
  confirm: 'shadow-[0_5px_0_var(--color-mint-underside)]',
};

const sizes: Record<ButtonSize, string> = {
  md: 'h-11 px-[18px] text-[15px]',
  state: 'h-[50px] px-[22px] text-[15px] lg:h-[52px] lg:px-6',
  lg: 'h-[54px] px-6 text-[16px]',
  cta: 'h-14 px-6 text-[16px] lg:h-[58px] lg:text-[17px]',
};

export function Button({
  variant = 'dark',
  size = 'lg',
  block,
  flat,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-pill font-sans font-bold whitespace-nowrap tabular-nums',
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris',
        'disabled:pointer-events-none disabled:bg-chip-haze disabled:text-ink-quiet disabled:shadow-none',
        variants[variant],
        !flat && (size === 'cta' ? pressCta[variant] : press[variant]),
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    />
  );
}
