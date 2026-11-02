import { Sheet } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useUnit } from 'effector-react';
import { Fragment } from 'react';

import {
  $checkState,
  $comment,
  $items,
  $notices,
  $open,
  $payable,
  $removed,
  $total,
  cartClosed,
  commentChanged,
  itemRemoved,
  itemRestored,
  MAX_COMMENT_LENGTH,
  quantityChanged,
} from '@/entities/cart';
import { shopQueryOptions } from '@/entities/shop';
import { $sentOrder, OrderButton, OrderSent } from '@/features/order-via-whatsapp';
import { useIsDesktop } from '@/shared/hooks';
import { formatPrice } from '@/shared/lib';

import { CartLine } from './cart-line';
import { UndoLine } from './undo-line';

/**
 * Корзина шторкой снизу на телефоне, выпадающей панелью под кнопкой корзины на компьютере. При открытии цены
 * и наличие перепроверяются: общая плашка «магазин кое-что обновил» и плашка у каждой изменённой строки
 * (FR-V7, S3, S10). После «Заказать через WhatsApp» вместо корзины — «Отправлено ✓» (FR-V8), на компьютере
 * окном по центру.
 */
export function CartSheet({ subdomain }: { subdomain: string }) {
  const { t } = useLingui();
  const desktop = useIsDesktop();
  const { data: shop } = useQuery(shopQueryOptions(subdomain));
  const { open, items, payable, notices, checkState, total, comment, sentOrder, removed } = useUnit({
    open: $open,
    items: $items,
    payable: $payable,
    notices: $notices,
    checkState: $checkState,
    total: $total,
    comment: $comment,
    sentOrder: $sentOrder,
    removed: $removed,
  });
  const { close, setQuantity, remove, restore, setComment } = useUnit({
    close: cartClosed,
    setQuantity: quantityChanged,
    remove: itemRemoved,
    restore: itemRestored,
    setComment: commentChanged,
  });
  const hasChanges = Object.keys(notices).length > 0;
  const placement = !desktop ? 'bottom' : sentOrder ? 'center' : 'dropdown-right';

  return (
    <Sheet
      open={open}
      onClose={close}
      placement={placement}
      hideTitle={!!sentOrder}
      title={sentOrder ? t`Заказ отправлен` : t`Корзина`}
    >
      {sentOrder ? (
        <OrderSent order={sentOrder} onClose={close} />
      ) : (
        <>
          {hasChanges && (
            <p
              role="status"
              className="mb-3.5 rounded-field bg-[#fff4d6] px-3.5 py-3 text-[14px] leading-[1.45] text-[#5a3e00]"
            >
              <Trans>Пока товары лежали в корзине, магазин кое-что обновил. Проверьте перед заказом.</Trans>
            </p>
          )}

          {items.length === 0 && !removed ? (
            <p className="text-[14px] text-ink-quiet">
              <Trans>Пока пусто. Откройте товар и выберите размер.</Trans>
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {items.map((item, index) => (
                  <Fragment key={item.variantId}>
                    {removed?.index === index && <UndoLine name={removed.item.name} onRestore={restore} />}
                    <CartLine
                      item={item}
                      notices={notices[item.variantId]}
                      compact={desktop}
                      onQuantity={(quantity) => setQuantity({ variantId: item.variantId, quantity })}
                      onRemove={() => remove(item.variantId)}
                      onNavigate={close}
                    />
                  </Fragment>
                ))}
                {removed && removed.index >= items.length && <UndoLine name={removed.item.name} onRestore={restore} />}
              </ul>

              {/* убрали последний товар — пока видна «Вернуть», итога и кнопки нет */}
              {items.length > 0 && (
                <>
                  <input
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    maxLength={MAX_COMMENT_LENGTH}
                    placeholder={t`Комментарий для магазина`}
                    aria-label={t`Комментарий для магазина`}
                    className="mt-4 h-12 w-full rounded-field bg-[#f6f5fb] px-3.5 text-[15px] text-ink-night outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-ink-night lg:mt-3.5 lg:h-11 lg:rounded-[14px] lg:text-[14px]"
                  />

                  <div className="mt-[18px] flex items-baseline justify-between lg:mt-3.5">
                    <span className="text-[15px] text-ink-soft lg:text-[14px]">
                      <Trans>Итого</Trans>
                    </span>
                    <span className="text-[22px] font-extrabold tabular-nums lg:text-[20px]">{formatPrice(total)}</span>
                  </div>

                  <div className="mt-3.5 lg:mt-3">
                    <OrderButton
                      subdomain={subdomain}
                      shop={shop ?? { name: '', whatsapp: '' }}
                      items={payable}
                      total={total}
                      comment={comment}
                      disabled={!shop || checkState === 'loading'}
                    />
                    <p className="mt-2.5 text-center text-[12px] text-ink-muted lg:hidden">
                      <Trans>Откроется WhatsApp с готовым сообщением для магазина</Trans>
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </Sheet>
  );
}
