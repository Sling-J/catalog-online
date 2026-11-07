import type { Category } from '@catalog/contract';
import { cx, Icon } from '@catalog/ui';
import { useSortable } from '@dnd-kit/react/sortable';
import { useLingui } from '@lingui/react/macro';
import type { ReactNode } from 'react';

/**
 * Строка категории (макет AdminPhone2, «Категории и размеры»): точки «перетаскивайте», название, число товаров.
 * Тянут за точки — порядок внутри своего уровня (`group`: верхний уровень или подкатегории одного родителя);
 * нажатие на строку — шторка категории. Подкатегории — внутри блока родителя и ездят вместе с ним.
 */
export function CategoryRow({
  category,
  index,
  group,
  first,
  nested,
  count,
  onOpen,
  children,
}: {
  category: Category;
  index: number;
  group: string;
  first?: boolean;
  nested?: boolean;
  count: ReactNode;
  onOpen: (category: Category) => void;
  children?: ReactNode;
}) {
  const { t } = useLingui();
  const { ref, handleRef, isDragSource } = useSortable({
    id: category.id,
    index,
    group,
    type: group,
    accept: group,
  });
  const name = category.name;
  return (
    <div
      ref={ref}
      className={cx(
        !first && 'border-t border-[#f0eef7]',
        isDragSource && 'relative z-10 bg-white shadow-[0_8px_24px_rgb(40_30_110/0.16)]',
      )}
    >
      <div
        className={cx('flex items-center gap-2.5 py-[11px] pr-3.5 hover:bg-[#f8f7fd]', nested ? 'pl-[38px]' : 'pl-3.5')}
      >
        <button
          ref={handleRef}
          type="button"
          aria-label={t`Перетащить «${name}»`}
          className="-m-1.5 flex-none cursor-grab touch-none p-1.5 text-ink-muted active:cursor-grabbing"
        >
          <Icon name="drag" size={18} strokeWidth={2.6} />
        </button>
        <button
          type="button"
          onClick={() => onOpen(category)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{name}</span>
          <span className="flex-none text-[13px] text-ink-quiet">{count}</span>
        </button>
      </div>
      {children}
    </div>
  );
}
