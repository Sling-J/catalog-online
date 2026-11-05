import type { Attribute } from '@catalog/contract';

import type { ProductForm, SelectOption } from '@/features/product-form';

/** Что экран нового товара передаёт раскладке телефона и компьютера. */
export type NewProductView = {
  form: ProductForm;
  attributes: Attribute[];
  categories: SelectOption[];
  /** `false` — «Черновик» (скрытым), `true` — «Сохранить и показать». */
  onSave: (visible: boolean) => void;
};
