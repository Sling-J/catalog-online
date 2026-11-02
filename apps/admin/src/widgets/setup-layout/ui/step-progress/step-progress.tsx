import { cx } from '@catalog/ui';

/** Полоска шагов мастера: пройденные и текущий — чернилами, остальные — дымкой. */
export function StepProgress({ step, total, className }: { step: number; total: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cx('flex gap-1.5', className)}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={cx('h-1.5 flex-1 rounded-pill', index < step ? 'bg-ink-night' : 'bg-chip-haze')} />
      ))}
    </div>
  );
}
