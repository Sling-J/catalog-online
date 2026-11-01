import type { CartItemChecked } from '@catalog/contract';

import type { CartItem, CartNotice, CartNotices } from '../types';

/** Закончившаяся или скрытая позиция: остаётся в списке серой, в сумму и в заказ не попадает. */
export const isBlocked = (notices: CartNotice[] | undefined): boolean =>
  !!notices?.some((notice) => notice.kind === 'out_of_stock' || notice.kind === 'unavailable');

/**
 * Применяет ответ `cart/check` к корзине. Что изменилось, определяем сравнением со снимком в корзине:
 * API не знает прежней цены и количества покупателя, поэтому не может надёжно вернуть
 * `price_changed` и `quantity_reduced` (open-questions). Позиции, которых нет в ответе, не трогаем.
 */
export function applyCheck(items: CartItem[], checked: CartItemChecked[]): { items: CartItem[]; notices: CartNotices } {
  const byVariant = new Map(checked.map((line) => [line.variantId, line]));
  const notices: CartNotices = {};

  const next = items.map((item) => {
    const line = byVariant.get(item.variantId);
    if (!line) return item;

    if (line.status === 'unavailable') {
      notices[item.variantId] = [{ kind: 'unavailable' }];
      return item;
    }
    if (line.status === 'out_of_stock' || line.quantity <= 0) {
      notices[item.variantId] = [{ kind: 'out_of_stock' }];
      return item;
    }

    const found: CartNotice[] = [];
    let updated = item;
    if (line.quantity < item.quantity) {
      found.push({ kind: 'quantity_reduced', to: line.quantity });
      updated = { ...updated, quantity: line.quantity };
    }
    if (typeof line.price === 'number' && line.price !== item.price) {
      found.push({ kind: 'price_changed', from: item.price, to: line.price });
      updated = { ...updated, price: line.price };
    }
    if (found.length > 0) notices[item.variantId] = found;
    return updated;
  });

  return { items: next, notices };
}
