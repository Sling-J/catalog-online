/**
 * Позиция корзины. Кроме варианта и количества хранится снимок товара, чтобы корзина показывалась
 * и без связи (S10); цены и наличие перепроверяются при открытии (FR-V7).
 */
export type CartItem = {
  variantId: string;
  quantity: number;
  productShortId: string;
  slug: string;
  name: string;
  /** «Рост 104» или пусто, если у товара нет свойств. */
  variantLabel: string;
  price: number;
  /** Адрес миниатюры. */
  photo: string | null;
  /** Остаток, если магазин показывает точное число; иначе `null`. */
  maxQuantity: number | null;
};
