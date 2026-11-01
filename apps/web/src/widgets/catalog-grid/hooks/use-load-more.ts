import { useEffect, useRef } from 'react';

/**
 * Вызывает `onLoadMore`, когда элемент-маркер у конца сетки появляется на экране.
 * `pagesLoaded` пересоздаёт наблюдателя после каждой страницы: если сетка всё ещё короче экрана,
 * маркер остаётся на виду и сам по себе повторно не сработает.
 */
export function useLoadMore(onLoadMore: () => void, enabled: boolean, pagesLoaded: number) {
  const marker = useRef<HTMLDivElement>(null);
  const callback = useRef(onLoadMore);
  callback.current = onLoadMore;

  useEffect(() => {
    const element = marker.current;
    if (!enabled || !element) return;
    // загружаем заранее, за экран до конца, чтобы покупатель не упирался в край
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && callback.current(), {
      rootMargin: '600px 0px',
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, pagesLoaded]);

  return marker;
}
