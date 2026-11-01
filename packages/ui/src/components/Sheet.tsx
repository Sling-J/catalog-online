import { useEffect, useId, useRef, type ReactNode } from 'react';

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
  className?: string;
};

const dropdown =
  'fixed top-[88px] bottom-auto m-0 h-fit max-h-[calc(100dvh-112px)] w-[400px] rounded-[26px] shadow-[0_24px_60px_rgb(23_19_61/0.18)] backdrop:bg-ink-night/15';

const placements: Record<SheetPlacement, string> = {
  bottom: 'top-auto bottom-0 w-full rounded-t-[28px] shadow-sheet',
  center: 'm-auto w-[min(560px,calc(100%-32px))] rounded-panel shadow-device',
  'dropdown-left': `${dropdown} left-[max(20px,calc(50%-600px))] right-auto`,
  'dropdown-right': `${dropdown} right-[max(20px,calc(50%-600px))] left-auto`,
};

/**
 * Шторка, окно или выпадающая панель поверх страницы на нативном dialog: фокус и затемнение даёт браузер.
 * Закрывается по Esc и по клику на затемнение.
 */
export function Sheet({ open, onClose, title, headerAction, children, placement = 'bottom', className }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close?.();
  }, [open]);

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
        'm-0 max-h-[88dvh] max-w-none overflow-y-auto bg-white p-0 font-sans text-ink-night backdrop:bg-ink-night/40',
        placements[placement],
        className,
      )}
    >
      <div className="px-4 pt-2.5 pb-6">
        {placement === 'bottom' && (
          <div aria-hidden="true" className="mx-auto mb-3.5 h-[5px] w-10 rounded-pill bg-[#dcd8ee]" />
        )}
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-title">
            {title}
          </h2>
          {headerAction}
        </div>
        <div className="mt-3.5">{children}</div>
      </div>
    </dialog>
  );
}
