import { cx } from '@catalog/ui';
import type { ReactNode } from 'react';

/** Приглушённая строка под главной кнопкой формы (макеты входа: 13 px на телефоне, 14 px на компьютере). */
export function FormNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cx(
        'mt-3.5 text-center text-[13px] leading-[1.5] text-ink-muted lg:text-[14px] lg:leading-[normal]',
        className,
      )}
    >
      {children}
    </p>
  );
}
