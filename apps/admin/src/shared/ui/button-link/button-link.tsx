import { cx } from '@catalog/ui';
import { Link, type LinkProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';

const variants = {
  primary: 'bg-sun text-ink-night shadow-press-sun hover:bg-sun-hover',
  dark: 'bg-ink-night text-white shadow-press-ink hover:bg-ink-hover',
} as const;

/** Ссылка, которая выглядит как главная кнопка формы (52 px): «Перейти в каталог», «Прислать новую ссылку». */
export function ButtonLink({
  to,
  variant,
  children,
  className,
}: {
  to: LinkProps['to'];
  variant: keyof typeof variants;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cx(
        'press flex h-[52px] w-full items-center justify-center rounded-pill px-[22px] text-[15px] font-bold',
        variants[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
