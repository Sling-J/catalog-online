import { createFileRoute } from '@tanstack/react-router';

import { AccountPage } from '@/pages/account';

// «Аккаунт»: почта, пароль, выход — по нажатию на карточку магазина в шапке или колонке (UX-аудит U10, A31).
// Вложенный экран: на телефоне без шапки магазина и нижнего меню (staticData.subScreen).
export const Route = createFileRoute('/_shell/account')({
  staticData: { subScreen: true },
  component: AccountPage,
});
