import { cx, Icon } from '@catalog/ui';
import type { ReactNode } from 'react';

/**
 * Файл импорта: зелёный значок документа, имя и строка о нём («218 строк · колонки как в прошлый раз»), справа —
 * действие. `card` — отдельная карточка с рамкой (телефон, макет AdminPhone, экран 5), иначе — шапка внутри большой
 * карточки (компьютер, макет AdminDesk, экран 3).
 */
export function FileHead({
  name,
  note,
  action,
  card,
  className,
}: {
  name: string;
  note: ReactNode;
  action?: ReactNode;
  card?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex items-center gap-2.5',
        card ? 'rounded-[18px] border border-[#eceaf5] bg-white px-3.5 py-3' : 'px-[18px] py-4',
        className,
      )}
    >
      <Icon name="file" size={card ? 24 : 22} className="flex-none text-stock-in" />
      <div className="min-w-0 flex-1">
        <div className={cx('truncate', card ? 'text-[14px] font-semibold' : 'text-[15px] font-bold')}>{name}</div>
        <div className={cx('text-ink-quiet', card ? 'text-[12px]' : 'text-[13px]')}>{note}</div>
      </div>
      {action}
    </div>
  );
}
