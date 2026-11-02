import { useEffect, useRef, useState } from 'react';

/**
 * Вызывает `onLoadMore`, когда элемент-маркер у конца сетки или списка появляется на экране (витрина, товары админки).
 * Возвращает ref-колбэк: маркер может смениться (телефонная разметка → компьютерная после гидратации),
 * и наблюдатель переезжает на новый элемент. `pagesLoaded` пересоздаёт наблюдателя после каждой страницы:
 * если список всё ещё короче экрана, маркер остаётся на виду и сам по себе повторно не сработает.
 */
export function useLoadMore(onLoadMore: () => void, enabled: boolean, pagesLoaded: number) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const callback = useRef(onLoadMore);
  callback.current = onLoadMore;

  useEffect(() => {
    if (!enabled || !element) return;
    // загружаем заранее, за экран до конца, чтобы покупатель не упирался в край
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && callback.current(), {
      rootMargin: '600px 0px',
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, pagesLoaded, element]);

  return setElement;
}
