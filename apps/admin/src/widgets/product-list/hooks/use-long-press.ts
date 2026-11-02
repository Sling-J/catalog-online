import { useRef, type PointerEvent } from 'react';

const HOLD_MS = 500;
const MOVE_PX = 10;

/**
 * Долгое нажатие на строку списка (выбор на телефоне, A20). Сдвиг пальца — это прокрутка, а не нажатие.
 * После долгого нажатия следующий клик гасится, чтобы строка не переключилась второй раз.
 */
export function useLongPress(onLongPress: () => void, onClick: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const start = useRef({ x: 0, y: 0 });
  const fired = useRef(false);
  const cancel = () => clearTimeout(timer.current);

  return {
    onPointerDown: (event: PointerEvent) => {
      fired.current = false;
      start.current = { x: event.clientX, y: event.clientY };
      cancel();
      timer.current = setTimeout(() => {
        fired.current = true;
        onLongPress();
      }, HOLD_MS);
    },
    onPointerMove: (event: PointerEvent) => {
      if (Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > MOVE_PX) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    // своё меню браузера на долгое нажатие не нужно
    onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault(),
    onClick: () => {
      if (fired.current) {
        fired.current = false;
        return;
      }
      onClick();
    },
  };
}
