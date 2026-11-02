import { Icon } from '@catalog/ui';
import { useEffect } from 'react';

const SHOW_MS = 3000;

/**
 * Сообщение после действия — тёмная пилюля с мятной галочкой внизу по центру рабочей области
 * (доска AdminProductsStates, экран 9). На телефоне — над нижним меню. Само исчезает через 3 секунды.
 */
export function Toast({ message, onHide }: { message: string | null; onHide: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onHide, SHOW_MS);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-[calc(100px+env(safe-area-inset-bottom))] left-1/2 z-40 flex h-12 max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2.5 rounded-pill bg-ink-night px-[18px] text-[14px] font-semibold whitespace-nowrap text-white shadow-[0_12px_30px_rgb(23_19_61/0.3)] motion-safe:animate-pop lg:bottom-8 lg:left-[calc(50%+124px)]"
    >
      <span className="flex size-[22px] flex-none items-center justify-center rounded-full bg-mint text-mint-ink">
        <Icon name="check" size={14} strokeWidth={3} />
      </span>
      <span className="truncate">{message}</span>
    </div>
  );
}
