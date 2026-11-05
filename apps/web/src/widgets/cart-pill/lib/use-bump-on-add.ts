import { useEffect, useRef } from 'react';

/** Сколько товаров видел каждый показ корзины в прошлый раз: плашка на телефоне пропадает на карточке товара. */
const seen = new Map<string, number>();

/** Пружина нажатия (`--ease-press`): быстро до 1.06 и с перелётом обратно к 1. */
const BUMP: Keyframe[] = [
  { transform: 'scale(1)' },
  { transform: 'scale(1.06)', offset: 0.3, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  { transform: 'scale(1)' },
];

/**
 * «Прыжок» кнопки корзины, когда товаров стало больше, чем она видела в прошлый раз (ideas.md, «Анимации»).
 * `key` разделяет плашку телефона и кнопку компьютера. Если элемент только что появился (плашка поднимается
 * снизу), прыгает после подъёма; масштаб складывается с его `transform` (`composite: 'add'`), а не заменяет.
 * По первому показу (прошлого раза нет) и при «меньше движения» не прыгает.
 */
export function useBumpOnAdd<T extends HTMLElement>(key: string, count: number, appearDelay = 0) {
  const ref = useRef<T>(null);
  const shown = useRef(false);

  useEffect(() => {
    const prev = seen.get(key);
    seen.set(key, count);
    const element = ref.current;
    const justAppeared = !shown.current;
    shown.current = !!element;
    if (!element || prev === undefined || count <= prev) return;
    // кнопка компьютера на телефоне и плашка на компьютере в DOM есть, но скрыты (`display: none`)
    if (element.getClientRects().length === 0) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    element.animate(BUMP, { duration: 400, delay: justAppeared ? appearDelay : 0, composite: 'add' });
  }, [key, count, appearDelay]);

  return ref;
}
