import { cx, formatPrice } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import type { Dispatch } from 'react';

import { canAdd, DEMO_PRODUCTS, orderCount, orderTotal, type DemoAction, type DemoState } from '@/pages/landing/lib';

import { PhoneFrame } from './phone-frame';

const chip = 'flex h-[30px] flex-none items-center rounded-pill px-3 text-[12px] font-semibold';

/**
 * Телефон покупателя (макет N, вариант Б, 2026-11-02): витрина «Айгерим Kids» в миниатюре — шапка магазина,
 * категории, сетка в две колонки. Под фото название и наличие, «+» на фото добавляет товар и становится
 * счётчиком; внизу — «Заказать в WhatsApp · сумма». Фото — заглушки, как пластилиновые предметы лендинга.
 */
export function BuyerPhone({ state, dispatch }: { state: DemoState; dispatch: Dispatch<DemoAction> }) {
  const { t } = useLingui();
  const count = orderCount(state);
  const canSend = state.phase === 'shop' && count > 0;

  return (
    <PhoneFrame tone="glass">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[41px] bg-paper">
        <div className="flex-none border-b border-[#eceaf5]">
          <div className="flex items-center gap-[9px] px-3.5 pt-4">
            <div className="flex size-[34px] flex-none items-center justify-center rounded-full bg-[linear-gradient(140deg,var(--color-blush),var(--color-violet))] text-[12px] font-extrabold text-white">
              АK
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-extrabold">Айгерим Kids ›</div>
              <div className="text-[11px] text-ink-quiet">
                <Trans>
                  ТЦ «Мега» · <span className="font-semibold text-stock-in">Открыто</span>
                </Trans>
              </div>
            </div>
            <div className="size-[34px] flex-none rounded-full bg-mint shadow-[0_3px_0_var(--color-mint-underside)]" />
          </div>
          <div className="flex gap-1.5 overflow-hidden px-3.5 py-2.5">
            <span className={cx(chip, 'bg-ink-night text-white')}>
              <Trans>Все</Trans>
            </span>
            <span className={cx(chip, 'bg-[#e9e5ff] text-iris')}>
              <Trans>Рост 110</Trans>
            </span>
            <span className={cx(chip, 'bg-chip-haze')}>
              <Trans>Куртки</Trans>
            </span>
            <span className={cx(chip, 'bg-chip-haze')}>
              <Trans>Платья</Trans>
            </span>
          </div>
        </div>

        <ul className="grid flex-1 grid-cols-2 content-start gap-x-2 gap-y-3 overflow-y-auto overscroll-contain px-2.5 [scrollbar-width:none] pt-2.5 pb-[90px]">
          {DEMO_PRODUCTS.map((product, index) => {
            const quantity = state.cart[index] ?? 0;
            const available = canAdd(state, index);
            const low = product.stock <= 2;
            return (
              <li key={product.name}>
                <div
                  role="img"
                  aria-label={t`Фото товара: ${product.name}`}
                  className="relative aspect-square rounded-thumb"
                  style={{
                    background: `radial-gradient(120% 120% at 30% 20%, ${product.colors[0]}, ${product.colors[1]})`,
                  }}
                >
                  <span className="absolute bottom-1.5 left-1.5 rounded-pill bg-white/92 px-[9px] py-1 text-[13px] font-bold tabular-nums">
                    {formatPrice(product.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'add', index })}
                    disabled={!available}
                    aria-label={t`Добавить: ${product.name}`}
                    className={cx(
                      'puffy absolute right-1.5 bottom-1.5 size-[34px] rounded-full text-[17px] font-extrabold',
                      quantity > 0
                        ? 'bg-sun text-ink-night shadow-[0_3px_0_var(--color-sun-underside)]'
                        : available
                          ? 'bg-ink-night text-white shadow-[0_3px_0_var(--color-ink-underside)]'
                          : 'bg-chip-haze text-[#b3afd0]',
                    )}
                  >
                    {quantity > 0 ? quantity : '+'}
                  </button>
                </div>
                <div className="mt-1.5 px-1 text-[12px] leading-[1.25] font-semibold">{product.name}</div>
                <div
                  className={cx(
                    'mt-[3px] flex items-center gap-[5px] px-1 text-[11px] font-semibold',
                    low ? 'text-stock-low' : 'text-stock-in',
                  )}
                >
                  <span className="size-[7px] rounded-full bg-current" />
                  {low ? <Trans>Осталось {product.stock}</Trans> : <Trans>В наличии</Trans>}
                </div>
              </li>
            );
          })}
        </ul>

        {/* сетка уходит под кнопку и гаснет */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[100px] bg-linear-to-b from-paper/0 to-paper to-55%" />
        <div className="absolute inset-x-3 bottom-3">
          <button
            type="button"
            onClick={() => dispatch({ type: 'send' })}
            disabled={!canSend}
            className={cx(
              'puffy min-h-[52px] w-full rounded-pill p-4 text-[15px] font-bold whitespace-nowrap tabular-nums',
              canSend
                ? 'bg-mint text-mint-ink shadow-[0_5px_0_var(--color-mint-underside)]'
                : 'bg-chip-haze text-ink-muted',
            )}
          >
            {state.phase !== 'shop' ? (
              <Trans>Заказ отправлен</Trans>
            ) : count > 0 ? (
              <Trans>Заказать в WhatsApp · {formatPrice(orderTotal(state))}</Trans>
            ) : (
              <Trans>Добавьте товары в заказ</Trans>
            )}
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
