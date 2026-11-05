import { useEffect, useRef } from 'react';

/** Пружина нажатия (`--ease-press`): быстро до 1.06 и с перелётом обратно к 1. */
const BUMP: Keyframe[] = [
  { transform: 'scale(1)' },
  { transform: 'scale(1.06)', offset: 0.3, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  { transform: 'scale(1)' },
];

/**
 * «Прыжок» кнопки корзины в шапке компьютера, когда товаров стало больше (ideas.md, «Анимации»).
 * Плашка телефона не прыгает: на карточке товара её нет, а в каталоге она и так поднимается снизу — второе
 * движение следом лишнее (решение основателя 2026-11-05). При первом показе и при «меньше движения» — без прыжка.
 * `quiet` — пока открыта корзина: там покупатель сам меняет количество и смотрит на «Итого»
 * (одно движение на нажатие).
 */
export function useBumpOnAdd<T extends HTMLElement>(count: number, { quiet = false }: { quiet?: boolean } = {}) {
  const ref = useRef<T>(null);
  const prev = useRef(count);

  useEffect(() => {
    const grew = count > prev.current;
    prev.current = count;
    const element = ref.current;
    if (!element || quiet || !grew) return;
    // на телефоне кнопка в DOM есть, но скрыта (`display: none`)
    if (element.getClientRects().length === 0) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    element.animate(BUMP, { duration: 400 });
  }, [count, quiet]);

  return ref;
}
