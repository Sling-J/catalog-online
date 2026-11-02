import { Plural, Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';

import { categoriesQueryOptions, flattenCategories } from '@/entities/category';

/**
 * Выпадающий список «Перенести N товаров в» под кнопкой «Сменить категорию» (доска AdminProductsStates, экран 8):
 * категории по порядку и «Без категории» под чертой. Выбор сразу переносит товары.
 */
export function CategoryMenu({ count, onPick }: { count: number; onPick: (categoryId: string | null) => void }) {
  const { data: tree } = useSuspenseQuery(categoriesQueryOptions());
  const item = 'flex h-10 w-full items-center rounded-xl px-3 text-left text-[14px] font-semibold hover:bg-chip-haze';
  return (
    <div
      role="menu"
      className="absolute top-[calc(100%+8px)] right-0 z-10 w-[280px] rounded-[20px] bg-white p-2 text-ink-night shadow-[0_1px_0_#eceaf5,0_18px_40px_rgb(40_20_110/0.18)]"
    >
      <div className="px-3 pt-2 pb-1.5 text-[12px] font-semibold text-ink-quiet">
        <Plural value={count} one="Перенести # товар в" few="Перенести # товара в" other="Перенести # товаров в" />
      </div>
      {flattenCategories(tree).map((category) => (
        <button
          key={category.id}
          type="button"
          role="menuitem"
          onClick={() => onPick(category.id)}
          className={item}
          style={{ paddingLeft: 12 + category.depth * 16 }}
        >
          {category.name}
        </button>
      ))}
      <div className="mx-1 my-1.5 h-px bg-[#f0eef7]" />
      <button type="button" role="menuitem" onClick={() => onPick(null)} className={`${item} text-ink-quiet`}>
        <Trans>Без категории</Trans>
      </button>
    </div>
  );
}
