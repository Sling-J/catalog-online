import type { StorefrontCategory } from '@catalog/contract';
import { Chip } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import { findCategoryPath } from '@/entities/category';

/** Верхняя лента: «Все» и категории; при открытой категории с вложенными — второй лентой её подкатегории. */
export function CategoryBar({
  categories,
  selectedId,
  onSelect,
}: {
  categories: StorefrontCategory[];
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
}) {
  const path = selectedId ? findCategoryPath(categories, selectedId) : [];
  const topSelected = path[0];
  const children = topSelected?.children ?? [];

  return (
    <div className="pb-3">
      <ChipRow>
        <Chip selected={!selectedId} onClick={() => onSelect(undefined)}>
          <Trans>Все</Trans>
        </Chip>
        {categories.map((category) => (
          <Chip key={category.id} selected={category.id === topSelected?.id} onClick={() => onSelect(category.id)}>
            {category.name}
          </Chip>
        ))}
      </ChipRow>
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

// Лента прокручивается пальцем, полосы прокрутки не показываем.
function ChipRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className ?? ''}`}
    >
      {children}
    </div>
  );
}
