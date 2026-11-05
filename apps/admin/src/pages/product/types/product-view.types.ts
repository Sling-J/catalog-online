import type { Product } from '@catalog/contract';
import type { FormEvent } from 'react';

import type { ProductForm, SelectOption } from '@/features/product-form';
import type { PhotoList } from '@/features/product-photos';

/** Что экран карточки товара передаёт раскладке телефона и компьютера. */
export type ProductView = {
  product: Product;
  /** Фото сохраняются сразу, отдельно от формы. */
  photos: PhotoList;
  form: ProductForm;
  categories: SelectOption[];
  /** Категория сохранённого товара — для «Товары / Куртки». */
  category: string | undefined;
  attributeName: string | undefined;
  /** Товар на витрине; нет адреса у магазина — нет ссылки. */
  storefrontLink: string | undefined;
  onCancel: () => void;
  onDeleted: () => void;
  onSubmit: (event: FormEvent) => void;
};
