import { createFileRoute, Outlet } from '@tanstack/react-router';

import { ShopSettingsLayout } from '@/widgets/shop-settings-layout';

// Раздел «Магазин» — настройки витрины (A31). На компьютере слева подменю настроек, справа выбранный экран (D1);
// на телефоне — экраны как были: список и вложенные экраны.
export const Route = createFileRoute('/_shell/shop')({
  component: () => (
    <ShopSettingsLayout>
      <Outlet />
    </ShopSettingsLayout>
  ),
});
