import type { StorefrontCategory } from '@catalog/contract';
import { Chip } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import { findCategoryPath } from '@/entities/category';

/** Верхняя лента: «Все» и категории; при открытой категории с вложенными — второй лентой её подкатегории. */
export function CategoryBar({
  categories,
  selectedId,
  onSelect,
  trailing,
}: {
  categories: StorefrontCategory[];
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
  /** Справа от категорий на компьютере: число товаров, фильтры, сортировка. */
  trailing?: React.ReactNode;
}) {
  const path = selectedId ? findCategoryPath(categories, selectedId) : [];
  const topSelected = path[0];
  const children = topSelected?.children ?? [];

  return (
    <div className="pb-3 lg:px-5 lg:pt-5 lg:pb-3.5">
      <div className="flex items-center lg:gap-4">
        <ChipRow className="flex-1">
          <Chip selected={!selectedId} onClick={() => onSelect(undefined)} className={desktopChip}>
            <Trans>Все</Trans>
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.id}
              selected={category.id === topSelected?.id}
              onClick={() => onSelect(category.id)}
              className={desktopChip}
            >
              {category.name}
            </Chip>
          ))}
        </ChipRow>
        {trailing && <div className="hidden flex-none items-center gap-2 lg:flex">{trailing}</div>}
      </div>
      {children.length > 0 && (
        <ChipRow className="mt-2">
          {children.map((child) => (
            <Chip
              key={child.id}
              selected={path.some((entry) => entry.id === child.id)}
              onClick={() => onSelect(child.id)}
            >
              {child.name}
            </Chip>
          ))}
        </ChipRow>
      )}
    </div>
  );
}

// На компьютере чипы выше и шире (макет: 40 px)
const desktopChip = 'lg:h-10 lg:px-[18px]';

// Лента прокручивается пальцем, полосы прокрутки не показываем.
function ChipRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex gap-2 overflow-x-auto px-4 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className ?? ''}`}
    >
      {children}
    </div>
  );
}
