import { cx } from '@catalog/ui';
import type { ReactNode } from 'react';

/** Центр пустого или служебного экрана: предмет, заголовок, пояснение и действия под ними. */
export function StateScreen({
  object,
  title,
  description,
  children,
  compact,
  desktopTop = 'sm',
  className,
}: {
  object: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Без верхнего отступа на компьютере — когда рядом стоит другой блок. */
  compact?: boolean;
  /** Верхний отступ на компьютере: в макетах 40 px у поиска, 50 px у «Нет связи». */
  desktopTop?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div
      className={cx(
        'mx-auto max-w-[420px] px-7 pt-14 text-center lg:max-w-[560px] lg:px-10',
        !compact && (desktopTop === 'md' ? 'lg:pt-[50px]' : 'lg:pt-10'),
        compact && 'lg:px-0 lg:pt-0',
        className,
      )}
    >
      {object}
      <h1 className="mt-6 text-[21px] leading-[1.25] font-extrabold tracking-[-0.01em] lg:mt-[26px] lg:text-[28px] lg:tracking-[-0.02em]">
        {title}
      </h1>
      {description && (
        <p className="mx-auto mt-2 max-w-[300px] text-[15px] leading-normal text-ink-soft lg:mt-2.5 lg:max-w-[460px] lg:text-[16px] lg:leading-[1.55]">
          {description}
        </p>
      )}
      {children && (
        <div className="mt-[22px] flex flex-col items-center gap-1.5 lg:mt-[26px] lg:flex-row lg:justify-center lg:gap-2.5">
          {children}
        </div>
      )}
    </div>
  );
}
