/** Значение свойства у строки таблицы размеров: по тексту, API создаст его, если нет («Свой размер»). */
export type RowValue = { attributeId: string; value: string };

/** Строка таблицы размеров в редакторе. */
export type VariantRow = {
  /** Ключ строки в списке; у сохранённого варианта совпадает с `id`. */
  key: string;
  /** Есть — вариант уже сохранён. */
  id?: string;
  /** Пусто — товар без размеров. */
  values: RowValue[];
  /** Цифры цены; пусто у нового товара — цена по умолчанию («Цена, ₸»). */
  price: string;
  stock: number;
  /** Пусто — артикул придумает API. */
  sku: string;
  barcode: string;
};

/** Карточка товара в редакторе, пока не сохранена. */
export type ProductDraft = {
  name: string;
  description: string;
  categoryId: string | null;
  isVisible: boolean;
  /** Свойство таблицы размеров (рост, размер обуви); `null` — без размеров. */
  attributeId: string | null;
  /** Цена по умолчанию у нового товара: «Цена у всех размеров одна». */
  price: string;
  /** Количество товара без размеров. */
  stock: number;
  rows: VariantRow[];
};

export type DraftField = 'name' | 'price' | 'variants';
export type DraftError = 'required' | 'no_price' | 'no_size' | 'duplicate';
export type DraftErrors = Partial<Record<DraftField, DraftError>>;
