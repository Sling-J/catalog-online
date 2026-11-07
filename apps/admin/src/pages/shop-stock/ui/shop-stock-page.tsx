import { Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { StockSettings } from '@/features/edit-stock-display';
import { shopQueryOptions } from '@/entities/shop';
import { BackBar } from '@/shared/ui';

/**
 * «Магазин → Наличие на витрине» (FR-A8; макет AdminPhone2, экран 11). Телефон — вложенный экран с «Назад».
 * На компьютере макета нет — путь, заголовок и колонка 560 px, как «Вход и пароль».
 */
export function ShopStockPage() {
  const { data: shop } = useSuspenseQuery(shopQueryOptions());
  return (
    <>
      <BackBar to="/shop">
        <Trans>Наличие на витрине</Trans>
      </BackBar>
      <div className="hidden lg:block">
        <div className="text-[14px] text-ink-quiet">
          <Link to="/shop" className="hover:text-ink-night">
            <Trans>Магазин</Trans>
          </Link>{' '}
          / <Trans>Наличие на витрине</Trans>
        </div>
        <h1 className="mt-1.5 text-[30px] font-extrabold tracking-[-0.03em]">
          <Trans>Наличие на витрине</Trans>
        </h1>
      </div>
      <div className="pb-8 lg:w-[560px]">
        <StockSettings shop={shop} />
      </div>
    </>
  );
}
