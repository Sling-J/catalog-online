import { useEffect, useRef } from 'react';

import { cx } from '../cx.js';

export type ChangingValueProps = {
  /** Что показать: сумма, количество. Сменилось — новое въезжает снизу. */
  value: string | number;
  className?: string;
};

/** Сдвиг снизу на 40% высоты строки с проявлением, 0.2s (`--ease-out-soft`). */
const ENTER: Keyframe[] = [
  { transform: 'translateY(0.4em)', opacity: 0 },
  { transform: 'translateY(0)', opacity: 1 },
];

/**
 * Значение, которое меняется на глазах (сумма в корзине, количество): при смене новое коротко въезжает снизу.
 * Элемент тот же, анимация — `element.animate`, поэтому текст не моргает и вокруг ничего не перестраивается.
 * При первом показе и при «меньше движения» — без анимации.
 */
export function ChangingValue({ value, className }: ChangingValueProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    const element = ref.current;
    // скрытое (`display: none`, например плашка телефона на компьютере) не анимируем
    if (!element || element.getClientRects().length === 0) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    element.animate?.(ENTER, { duration: 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  }, [value]);

  return (
    <span ref={ref} className={cx('inline-block', className)}>
      {value}
    </span>
  );
}
