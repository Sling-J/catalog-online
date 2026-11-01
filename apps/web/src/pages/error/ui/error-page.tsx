import { Button } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { categoriesQueryOptions } from '@/entities/category';
import { shopQueryOptions } from '@/entities/shop';
import { ClayCloud, StateScreen } from '@/shared/ui';
import { AboutShopSheet } from '@/widgets/about-shop-sheet';
import { CartButton, CartPill } from '@/widgets/cart-pill';
import { CategoryBar } from '@/widgets/category-bar';
import { ShopHeader } from '@/widgets/shop-header';

/**
 * Не удалось загрузить страницу. Нет сети — «Нет связи» и обещание, что каталог загрузится сам, когда она
 * вернётся; иначе — общая ошибка. Если магазин и категории уже были в кеше (ошибка случилась уже внутри
 * витрины), сверху остаются шапка и категории, как в макете. Корзина лежит на устройстве (S10).
 */
export function ErrorPage({ subdomain, onRetry }: { subdomain?: string; onRetry: () => void }) {
  const [online, setOnline] = useState(true);

  // состояние сети знает только браузер: читаем после гидратации и следим за возвращением связи
  useEffect(() => {
    setOnline(navigator.onLine);
    const update = () => setOnline(navigator.onLine);
    const back = () => {
      update();
      onRetry();
    };
    window.addEventListener('offline', update);
    window.addEventListener('online', back);
    return () => {
      window.removeEventListener('offline', update);
      window.removeEventListener('online', back);
    };
  }, [onRetry]);

  return (
    <main className="min-h-dvh bg-paper font-sans text-ink-night">
      {subdomain && <CachedShell subdomain={subdomain} />}
      <StateScreen
        desktopTop="md"
        object={<ClayCloud rotate={-4} />}
        title={online ? <Trans>Что-то пошло не так</Trans> : <Trans>Нет связи</Trans>}
        description={
          online ? (
            <Trans>Не получилось загрузить страницу. Попробуйте ещё раз — обычно это быстро проходит.</Trans>
          ) : (
            <>
              <Trans>Похоже, пропал интернет. Как только связь вернётся, каталог загрузится сам.</Trans>
              <span className="hidden lg:inline">
                {' '}
                <Trans>Корзина сохранена на этом устройстве.</Trans>
              </span>
            </>
          )
        }
      >
        <Button size="state" onClick={onRetry}>
          <Trans>Повторить</Trans>
        </Button>
      </StateScreen>
      {/* на телефоне про корзину — отдельной плашкой под кнопкой, на компьютере — в тексте выше */}
      <p className="mx-4 mt-10 rounded-thumb bg-[#f1effa] px-4 py-3.5 text-[14px] leading-normal text-ink-soft lg:hidden">
        <Trans>Корзина сохранена на этом телефоне — товары никуда не денутся.</Trans>
      </p>
      {subdomain && <CartPill subdomain={subdomain} />}
    </main>
  );
}

/** Шапка и категории из кеша — только если магазин уже загружался; иначе их просто нет. */
function CachedShell({ subdomain }: { subdomain: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [aboutOpen, setAboutOpen] = useState(false);
  const shop = queryClient.getQueryData(shopQueryOptions(subdomain).queryKey);
  const categories = queryClient.getQueryData(categoriesQueryOptions(subdomain).queryKey);
  if (!shop) return null;

  return (
    <>
      <ShopHeader shop={shop} onOpenAbout={() => setAboutOpen(true)} actions={<CartButton subdomain={subdomain} />}>
        {categories && (
          <CategoryBar
            categories={categories}
            selectedId={undefined}
            onSelect={(category) => void router.navigate({ to: '/', search: { category } })}
          />
        )}
      </ShopHeader>
      <AboutShopSheet shop={shop} open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
