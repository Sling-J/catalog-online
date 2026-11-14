import { useEffect, type RefObject } from 'react';

/**
 * Пока окно прокручивается, элемент не реагирует на указатель (`pointer-events: none`), и ещё `idleMs` после
 * остановки. Зачем: при прокрутке колесом плитки проезжают под неподвижным курсором, а Chrome не сообщает, что
 * курсор с плитки ушёл, — отложенная загрузка карточки по наведению (`defaultPreload: 'intent'` роутера) не
 * отменялась, и за одну прокрутку грузились карточки, которые никто не открывал (e2e T-502). Без указателя
 * наведение кончается сразу, загрузка отменяется; эффект наведения на время прокрутки тоже не мигает.
 */
export function usePointerPauseOnScroll(ref: RefObject<HTMLElement | null>, idleMs = 150): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const resume = () => {
      if (ref.current) ref.current.style.pointerEvents = '';
    };
    const onScroll = () => {
      if (ref.current) ref.current.style.pointerEvents = 'none';
      clearTimeout(timer);
      timer = setTimeout(resume, idleMs);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
      resume();
    };
  }, [ref, idleMs]);
}
