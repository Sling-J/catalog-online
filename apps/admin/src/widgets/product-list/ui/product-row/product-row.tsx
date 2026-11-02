import type { ProductListItem } from '@catalog/contract';
import { cx } from '@catalog/ui';
import { Plural } from '@lingui/react/macro';

import { ProductThumb, stockLevel } from '@/entities/product';

import { useLongPress } from '../../hooks';
import { PriceText } from '../price-text';
import { RowTags } from '../row-tags';
import { SelectBox } from '../select-box';
import { StockText } from '../stock-text';

/**
 * Строка списка на телефоне (макет AdminPhone, экран 2): фото, название, «Категория · N вариантов», цена, остаток.
 * Долгое нажатие начинает выбор; в режиме выбора слева квадрат, нажатие переключает строку (доска
 * AdminProductsStates, экран 1).
 */
export function ProductRow({
  product,
  lowStockThreshold,
  selecting,
  selected,
  onToggle,
}: {
  product: ProductListItem;
  lowStockThreshold: number;
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  // карточка товара — T-306; пока нажатие без выбора ничего не делает
  const press = useLongPress(onToggle, () => selecting && onToggle());
  const variants = <Plural value={product.variantCount} one="# вариант" few="# варианта" other="# вариантов" />;
  return (
    <li
      {...press}
      aria-selected={selecting ? selected : undefined}
      className={cx(
        'flex items-center gap-3 border-b border-[#f0eef7] py-2.5 select-none [-webkit-touch-callout:none]',
        selecting && 'px-4',
        selected && 'bg-[#f4f1ff]',
      )}
    >
      {selecting && <SelectBox selected={selected} label={product.name} onToggle={onToggle} />}
      <ProductThumb cover={product.cover} size="list" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{product.name}</div>
        <div className="text-[13px] text-ink-quiet">
          {product.category ? (
            <>
              {product.category.name} · {variants}
            </>
          ) : (
            variants
          )}
        </div>
        <RowTags product={product} />
      </div>
      <div className="text-right">
        <div className="text-[15px] font-extrabold tabular-nums">
          <PriceText price={product.price} varies={product.priceVaries} />
        </div>
        <StockText
          total={product.totalStock}
          level={stockLevel(product.totalStock, lowStockThreshold)}
          className="block text-[12px]"
        />
      </div>
    </li>
  );
}
