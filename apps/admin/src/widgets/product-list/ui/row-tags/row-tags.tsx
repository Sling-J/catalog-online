import type { ProductListItem } from '@catalog/contract';
import { Trans } from '@lingui/react/macro';

const TAG = 'inline-flex h-[26px] items-center rounded-pill bg-[#f1effa] px-2.5 text-[12px] font-bold text-ink-quiet';

/** Метки строки на телефоне: «без фото», «скрыт» (макет AdminPhone, экран 2). */
export function RowTags({ product }: { product: ProductListItem }) {
  const noPhoto = product.photoCount === 0;
  if (!noPhoto && product.isVisible) return null;
  return (
    <div className="mt-1 flex gap-1.5">
      {noPhoto && (
        <span className={TAG}>
          <Trans>без фото</Trans>
        </span>
      )}
      {!product.isVisible && (
        <span className={TAG}>
          <Trans>скрыт</Trans>
        </span>
      )}
    </div>
  );
}
