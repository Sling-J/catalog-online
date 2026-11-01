import { cx } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import type { Dispatch } from 'react';

import { formatPrice } from '@/shared/lib';

import { canAdd, DEMO_PRODUCTS, orderCount, orderTotal, type DemoAction, type DemoState } from '@/pages/landing/lib';

import { PhoneFrame } from './phone-frame';

/** Телефон покупателя: каталог «Айгерим Kids» в росте 110, «+» добавляет товар, внизу — «Заказать через WhatsApp». */
export function BuyerPhone({ state, dispatch }: { state: DemoState; dispatch: Dispatch<DemoAction> }) {
  const { t } = useLingui();
  const count = orderCount(state);
  const canSend = state.phase === 'shop' && count > 0;

  return (
    <PhoneFrame tone="glass">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[41px] bg-paper">
        <div className="flex items-center gap-2.5 px-[18px] pt-5 pb-2.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(140deg,var(--color-blush),var(--color-violet))] text-[13px] font-bold text-white">
            АK
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold">Айгерим Kids</div>
            <div className="text-[12px] text-ink-muted">
              <Trans>Рост 110 · в наличии</Trans>
            </div>
          </div>
        </div>

        <ul className="flex flex-1 flex-col gap-2.5 overflow-hidden px-3.5 pt-1.5 pb-[86px]">
          {DEMO_PRODUCTS.map((product, index) => {
            const quantity = state.cart[index] ?? 0;
            const available = canAdd(state, index);
            const tone = product.stock <= 2 ? 'text-stock-low' : 'text-stock-in';
            return (
              <li key={product.name} className="flex items-center gap-3 rounded-row bg-white p-2.5 shadow-card">
                <div
                  role="img"
                  aria-label={t`Фото товара: ${product.name}`}
                  className="size-[60px] flex-none rounded-thumb"
                  style={{
                    background: `radial-gradient(120% 120% at 30% 20%, ${product.colors[0]}, ${product.colors[1]})`,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] leading-[1.25] font-semibold">{product.name}</div>
                  <div className="mt-0.5 text-[15px] font-extrabold tabular-nums">{formatPrice(product.price)}</div>
                  <div className={cx('mt-[3px] flex items-center gap-[5px] text-[11px] font-semibold', tone)}>
                    <span className="size-[7px] rounded-full bg-current" />
                    {product.stock <= 2 ? <Trans>Осталось {product.stock}</Trans> : <Trans>В наличии</Trans>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'add', index })}
                  disabled={!available}
                  aria-label={t`Добавить: ${product.name}`}
                  className={cx(
                    'puffy size-11 flex-none rounded-full text-[18px] font-extrabold',
                    quantity > 0
                      ? 'bg-sun text-ink-night shadow-[0_4px_0_var(--color-sun-underside)]'
                      : available
                        ? 'bg-ink-night text-white shadow-[0_4px_0_var(--color-ink-underside)]'
                        : 'bg-chip-haze text-[#b3afd0]',
                  )}
                >
                  {quantity > 0 ? quantity : '+'}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="absolute inset-x-3 bottom-3">
          <button
            type="button"
            onClick={() => dispatch({ type: 'send' })}
            disabled={!canSend}
            className={cx(
              'puffy min-h-[52px] w-full rounded-pill p-4 text-[15px] font-bold tabular-nums',
              canSend
                ? 'bg-mint text-mint-ink shadow-[0_5px_0_var(--color-mint-underside)]'
                : 'bg-chip-haze text-ink-muted',
            )}
          >
            {state.phase !== 'shop' ? (
              <Trans>Заказ отправлен</Trans>
            ) : count > 0 ? (
              <Trans>Заказать через WhatsApp · {formatPrice(orderTotal(state))}</Trans>
            ) : (
              <Trans>Добавьте товары в заказ</Trans>
            )}
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
