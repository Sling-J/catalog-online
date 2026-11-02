import type { ProductListItem } from '@catalog/contract';
import { cx } from '@catalog/ui';
import { Plural, Trans } from '@lingui/react/macro';

import { VisibilityToggle } from '@/features/toggle-product-visibility';
import { ProductThumb, stockLevel } from '@/entities/product';

import { COLUMNS } from '../../../constants';
import { PriceText } from '../../price-text';
import { SelectBox } from '../../select-box';
import { StockText } from '../../stock-text';

/** Строка таблицы на компьютере (макет AdminDesk, экран 1); выбранная — на сиреневом. */
export function TableRow({
  product,
  lowStockThreshold,
  selected,
  onToggle,
}: {
  product: ProductListItem;
  lowStockThreshold: number;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      role="row"
      className={cx(COLUMNS, 'items-center border-t border-[#f0eef7] py-2.5 text-[14px]', selected && 'bg-[#f4f1ff]')}
    >
      <span role="cell">
        <SelectBox selected={selected} label={product.name} onToggle={onToggle} />
      </span>
      <span role="cell">
        <ProductThumb cover={product.cover} size="table" />
      </span>
      <div role="cell" className="min-w-0">
        <div className="truncate font-semibold">{product.name}</div>
        <div className="text-[12px] text-ink-quiet">
          {product.photoCount === 0 ? <Trans>арт. {product.sku} · без фото</Trans> : <Trans>арт. {product.sku}</Trans>}
        </div>
      </div>
      <span role="cell" className="truncate">
        {product.category?.name}
      </span>
      <span role="cell" className="text-ink-quiet">
        <Plural value={product.variantCount} one="# вариант" few="# варианта" other="# вариантов" />
      </span>
      <span role="cell" className="font-bold tabular-nums">
        <PriceText price={product.price} varies={product.priceVaries} />
      </span>
      <span role="cell">
        <StockText total={product.totalStock} level={stockLevel(product.totalStock, lowStockThreshold)} short />
      </span>
      <span role="cell">
        <VisibilityToggle product={product} />
      </span>
    </div>
  );
}
