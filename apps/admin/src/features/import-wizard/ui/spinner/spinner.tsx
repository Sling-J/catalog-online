import { cx } from '@catalog/ui';

/** Крутилка ожидания: API читает, проверяет или загружает файл в фоне. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-block flex-none animate-spin rounded-full border-chip-haze border-t-iris motion-reduce:animate-[spin_2s_linear_infinite]',
        className,
      )}
    />
  );
}
