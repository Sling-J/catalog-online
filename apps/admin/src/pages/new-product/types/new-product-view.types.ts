import type { Attribute } from '@catalog/contract';

import type { ProductForm, SelectOption } from '@/features/product-form';
import type { PhotoList } from '@/features/product-photos';

/** Что экран нового товара передаёт раскладке телефона и компьютера. */
export type NewProductView = {
  form: ProductForm;
  photos: PhotoList;
  attributes: Attribute[];
  categories: SelectOption[];
  /** `false` — «Черновик» (скрытым), `true` — «Сохранить и показать». */
  onSave: (visible: boolean) => void;
};
