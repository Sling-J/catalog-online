import { createFileRoute, redirect } from '@tanstack/react-router';

// Стартовый экран — Товары (A2). Главная с чек-листом до публикации появится в T-304.
export const Route = createFileRoute('/_shell/')({
  beforeLoad: () => {
    throw redirect({ to: '/products', replace: true });
  },
});
