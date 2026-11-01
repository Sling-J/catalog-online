import { cx } from '@catalog/ui';

/** Мерцающая заглушка на месте ещё не загруженного (макет «Загрузка»). */
export function Skeleton({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      aria-hidden="true"
      style={delay ? { animationDelay: `${delay}s` } : undefined}
      className={cx(
        'bg-[linear-gradient(90deg,#eeecf8_0%,#f7f6fc_45%,#eeecf8_90%)] bg-size-[220%_100%] motion-safe:animate-shimmer',
        className,
      )}
    />
  );
}
