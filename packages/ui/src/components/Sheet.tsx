import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { cx } from '../cx.js';

/**
 * bottom — шторка снизу (телефон), center — окно по центру, dropdown-left / dropdown-right — выпадающая панель
 * под шапкой у левого или правого края контейнера (компьютер).
 */
export type SheetPlacement = 'bottom' | 'center' | 'dropdown-left' | 'dropdown-right';

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Действие справа от заголовка, например «Сбросить». */
  headerAction?: ReactNode;
  children: ReactNode;
  placement?: SheetPlacement;
  /** Заголовок только для экранных дикторов — когда макет начинает шторку сразу с содержимого. */
  hideTitle?: boolean;
  className?: string;
};

// выпадающая панель не затемняет страницу и «всплывает» под шапкой (макет компьютера)
const dropdown =
  'fixed top-[88px] bottom-auto m-0 h-fit max-h-[calc(100dvh-112px)] w-[400px] rounded-[26px] shadow-[0_24px_60px_rgb(23_19_61/0.18)] backdrop:bg-transparent';

const placements: Record<SheetPlacement, string> = {
  bottom: 'top-auto bottom-0 w-full rounded-t-[28px] shadow-sheet',
  center:
    'm-auto w-[min(600px,calc(100%-32px))] rounded-[34px] shadow-[0_40px_100px_rgb(11_10_38/0.35)] backdrop:bg-ink-night/55',
  'dropdown-left': `${dropdown} left-[max(20px,calc(50%-600px))] right-auto`,
  'dropdown-right': `${dropdown} right-[max(20px,calc(50%-600px))] left-auto`,
};

// открытие: шторка поднимается снизу, окно и панель всплывают; затемнение проявляется
const opening: Record<SheetPlacement, string> = {
  bottom: 'motion-safe:animate-sheet-up motion-safe:backdrop:animate-fade',
  center: 'motion-safe:animate-pop motion-safe:backdrop:animate-fade',
  'dropdown-left': 'motion-safe:animate-pop',
  'dropdown-right': 'motion-safe:animate-pop',
};

// закрытие: шторка уходит вниз, окно и панель гаснут (длительности — как у animate-*-out в tokens.css)
const closing: Record<SheetPlacement, string> = {
  bottom: 'motion-safe:animate-sheet-down',
  center: 'motion-safe:animate-pop-out',
  'dropdown-left': 'motion-safe:animate-pop-out',
  'dropdown-right': 'motion-safe:animate-pop-out',
};
const CLOSE_MS = 240;

// шторку закрываем, если её дотянули ниже порога или резко смахнули
const DRAG_CLOSE_PX = 100;
const DRAG_CLOSE_SPEED = 0.5; // px/мс

/**
 * Шторка, окно или выпадающая панель поверх страницы на нативном dialog: фокус и затемнение даёт браузер.
 * Закрывается по Esc и по клику на затемнение, шторка — ещё и смахиванием вниз (за ручку, заголовок или
 * содержимое, прокрученное до верха). Пока открыта, страница под ней не прокручивается.
 */
export function Sheet({
  open,
  onClose,
  title,
  headerAction,
  children,
  placement = 'bottom',
  hideTitle,
  className,
}: SheetProps) {
  const isDropdown = placement === 'dropdown-left' || placement === 'dropdown-right';
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [leaving, setLeaving] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      setLeaving(false);
      dialog.style.transform = '';
      if (!dialog.open) dialog.showModal?.();
      return;
    }
    if (!dialog.open) return;
    // без анимации («меньше движения») закрываем сразу, иначе — после неё
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      dialog.close?.();
      return;
    }
    setLeaving(true);
    const id = setTimeout(() => {
      dialog.close?.();
      dialog.style.transform = '';
      setLeaving(false);
    }, CLOSE_MS);
    return () => clearTimeout(id);
  }, [open]);

  // страница под открытой шторкой не прокручивается
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = overflow;
    };
  }, [open]);

  // смахивание шторки вниз: touch-события, чтобы отличить жест от прокрутки содержимого
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || placement !== 'bottom') return;
    let startY = 0;
    let startTime = 0;
    let offset = 0;
    let dragging = false;

    const onStart = (event: TouchEvent) => {
      startY = event.touches[0]!.clientY;
      startTime = event.timeStamp;
      offset = 0;
      dragging = false;
    };
    const onMove = (event: TouchEvent) => {
      const dy = event.touches[0]!.clientY - startY;
      // тянем вниз, а содержимое уже прокручено до верха — это жест закрытия, а не прокрутка
      if (!dragging && dy > 4 && dialog.scrollTop <= 0) {
        dragging = true;
        dialog.style.transition = 'none';
      }
      if (!dragging) return;
      event.preventDefault();
      offset = Math.max(0, dy);
      dialog.style.transform = `translateY(${offset}px)`;
    };
    const onEnd = (event: TouchEvent) => {
      if (!dragging) return;
      dragging = false;
      const speed = offset / Math.max(1, event.timeStamp - startTime);
      if (offset > DRAG_CLOSE_PX || (speed > DRAG_CLOSE_SPEED && offset > 20)) {
        // уходит вниз с того места, где отпустили (у анимации закрытия нет начального кадра)
        dialog.style.transition = '';
        onCloseRef.current();
        return;
      }
      dialog.style.transition = 'transform 0.25s var(--ease-out-soft)';
      dialog.style.transform = '';
    };

    dialog.addEventListener('touchstart', onStart, { passive: true });
    dialog.addEventListener('touchmove', onMove, { passive: false });
    dialog.addEventListener('touchend', onEnd);
    dialog.addEventListener('touchcancel', onEnd);
    return () => {
      dialog.removeEventListener('touchstart', onStart);
      dialog.removeEventListener('touchmove', onMove);
      dialog.removeEventListener('touchend', onEnd);
      dialog.removeEventListener('touchcancel', onEnd);
    };
  }, [placement]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cx(
        'm-0 max-h-[88dvh] max-w-none overflow-y-auto overscroll-contain bg-white p-0 font-sans text-ink-night backdrop:bg-ink-night/42',
        placements[placement],
        leaving
          ? cx(closing[placement], 'pointer-events-none motion-safe:backdrop:animate-fade-out')
          : opening[placement],
        className,
      )}
    >
      <div className={isDropdown ? 'p-5' : placement === 'center' ? 'px-12 pt-12 pb-10' : 'px-4 pt-2.5 pb-6'}>
        {placement === 'bottom' && (
          <div aria-hidden="true" className="mx-auto mb-3.5 h-[5px] w-10 rounded-pill bg-[#dcd8ee]" />
        )}
        {hideTitle ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className={isDropdown ? 'text-[19px] font-extrabold' : 'text-[20px] font-extrabold'}>
              {title}
            </h2>
            {headerAction}
          </div>
        )}
        <div className={hideTitle ? undefined : isDropdown ? 'mt-3' : 'mt-3.5'}>{children}</div>
      </div>
    </dialog>
  );
}
