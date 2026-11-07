import type { Shop } from '@catalog/contract';
import type { FormEvent } from 'react';

import type { ShopInfoForm } from '@/features/edit-shop-info';

/** Что нужно экрану «О магазине» на телефоне и на компьютере. */
export type ShopInfoView = {
  shop: Shop;
  form: ShopInfoForm;
  onSubmit: (event: FormEvent) => void;
};
