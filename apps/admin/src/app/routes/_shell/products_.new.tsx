import { createFileRoute } from '@tanstack/react-router';

import { NewProductPage } from '@/pages/new-product';

// Новый товар вручную — вложенный экран (на телефоне без шапки и меню). Редактор — T-306.
export const Route = createFileRoute('/_shell/products_/new')({
  staticData: { subScreen: true },
  component: NewProductPage,
});
