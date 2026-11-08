import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { PublishedSheet } from '@/features/publish-shop';
import { shopQueryOptions } from '@/entities/shop';

import { LaunchHome } from './launch-home';
import { ShopHome } from './shop-home';

/**
 * «Главная» — первый пункт меню (UX-аудит, U6; A31). Один адрес в любом статусе: до запуска — чек-лист и публикация,
 * после — сводка. Опубликовали отсюда — экран остаётся, содержимое меняется на сводку, поверх — момент успеха (U4).
 */
export function HomePage() {
  const { data: shop } = useSuspenseQuery(shopQueryOptions());
  const [published, setPublished] = useState(false);
  return (
    <>
      {shop.status === 'draft' ? <LaunchHome onPublished={() => setPublished(true)} /> : <ShopHome />}
      <PublishedSheet open={published} onClose={() => setPublished(false)} />
    </>
  );
}
