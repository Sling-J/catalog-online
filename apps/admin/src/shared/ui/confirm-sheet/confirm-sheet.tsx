import { Button, Sheet, useIsDesktop } from '@catalog/ui';
import type { ReactNode } from 'react';

/**
 * Подтверждение действия, которое не отменить: шторка снизу на телефоне, окно по центру на компьютере
 * (как «Перенести в категорию»). Главная кнопка тёмная, «Отмена» серая.
 */
export function ConfirmSheet({
  open,
  title,
  text,
  confirm,
  cancel,
  pending,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: ReactNode;
  text: ReactNode;
  confirm: ReactNode;
  cancel: ReactNode;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const isDesktop = useIsDesktop();
  return (
    <Sheet open={open} onClose={onClose} title={title} placement={isDesktop ? 'center' : 'bottom'}>
      <p className="-mt-[9px] text-[15px] leading-[1.45] text-ink-quiet">{text}</p>
      {/* «Отмена» первой в разметке — на ней фокус при открытии, Enter не подтвердит случайно; на экране главная
          кнопка сверху (телефон) или справа (компьютер) */}
      <div className="mt-[18px] flex flex-col-reverse gap-2.5 lg:flex-row">
        <Button variant="soft" size="form" block onClick={onClose} className="lg:flex-1">
          {cancel}
        </Button>
        <Button variant="dark" size="form" block disabled={pending} onClick={onConfirm} className="lg:flex-1">
          {confirm}
        </Button>
      </div>
    </Sheet>
  );
}
