import { cx } from '@catalog/ui';
import type { ReactNode } from 'react';

const tones = {
  muted: 'text-ink-muted',
  error: 'text-coral-underside',
  ok: 'font-semibold text-stock-in',
  checking: 'font-semibold text-ink-muted',
} as const;

/** Подпись под крупным полем мастера: 13 px на телефоне, 14 px на компьютере; отступ сверху задаёт шаг. */
export function BigFieldCaption({
  tone,
  className,
  children,
}: {
  tone: keyof typeof tones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : undefined}
      className={cx('text-[13px] lg:text-[14px]', tones[tone], className)}
    >
      {children}
    </p>
  );
}
