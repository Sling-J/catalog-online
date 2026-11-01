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
  /** «Рост: 104, Цвет: синий» или пусто, если у товара нет свойств. */
  variantLabel: string;
  price: number;
  /** Адрес миниатюры. */
  photo: string | null;
  /** Остаток, если магазин показывает точное число; иначе `null`. */
  maxQuantity: number | null;
};

/** Что изменилось в позиции при перепроверке (плашка у строки). */
export type CartNotice =
  | { kind: 'price_changed'; from: number; to: number }
  | { kind: 'quantity_reduced'; to: number }
  | { kind: 'out_of_stock' }
  | { kind: 'unavailable' };

/** Изменения по позициям: ключ — id варианта. */
export type CartNotices = Record<string, CartNotice[]>;

/** Как прошла перепроверка: `failed` — нет связи, показываем сохранённую корзину. */
export type CheckState = 'idle' | 'loading' | 'done' | 'failed';
