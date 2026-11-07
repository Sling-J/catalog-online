import { cx } from '@catalog/ui';
import type { ButtonHTMLAttributes } from 'react';

/** Действие-ссылка синим, 14 px: «Скачать шаблон», «Другой файл» (макет AdminDesk, экран 3). */
export function TextAction({ className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx(
        'flex-none text-[14px] font-semibold whitespace-nowrap text-iris hover:underline disabled:opacity-60',
        className,
      )}
      {...rest}
    />
  );
}
