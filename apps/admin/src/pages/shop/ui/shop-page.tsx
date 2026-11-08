import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { PublishedSheet } from '@/features/publish-shop';
import { attributesQueryOptions } from '@/entities/attribute';
import { categoriesQueryOptions, flattenCategories } from '@/entities/category';
import { shopQueryOptions, storefrontUrl } from '@/entities/shop';
import { PageTitle, Toast } from '@/shared/ui';

import { SettingsRow } from './settings-row';
import { StorefrontCard } from './storefront-card';

/**
 * Раздел «Магазин» — настройки витрины (FR-A9; макет AdminPhone2, экран 8; структура — A31). Телефон: публикация и
 * пункты настроек. Компьютер: пункты — в подменю слева (`ShopSettingsLayout`), здесь только «Публикация» — последний пункт;
 * «Магазин» в колонке открывает «О магазине».
 * Статистика переехала на главную, аккаунт — к карточке магазина (UX-аудит, U2, U10).
 */
export function ShopPage() {
  const { t } = useLingui();
  const { data: shop } = useSuspenseQuery(shopQueryOptions());
  const { data: tree } = useSuspenseQuery(categoriesQueryOptions());
  const { data: attributes } = useSuspenseQuery(attributesQueryOptions());
  const [published, setPublished] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const hideMessage = useCallback(() => setMessage(null), []);
  const url = shop.subdomain ? storefrontUrl(shop.subdomain, window.location.origin) : null;
  const categoryCount = flattenCategories(tree).length;
  const threshold = shop.lowStockThreshold;

  return (
    <>
      <PageTitle>
        <span className="lg:hidden">
          <Trans>Магазин</Trans>
        </span>
        <span className="hidden lg:inline">
          <Trans>Публикация</Trans>
        </span>
      </PageTitle>
      <div className="lg:w-[560px]">
        <StorefrontCard
          shop={shop}
          url={url}
          onPublished={() => setPublished(true)}
          onUnpublished={() => setMessage(t`Витрина скрыта`)}
        />
        <nav className="mt-3.5 overflow-hidden rounded-[22px] bg-white shadow-[0_1px_0_#eceaf5] lg:hidden">
          <SettingsRow
            first
            to="/shop/info"
            icon="store"
            title={<Trans>О магазине</Trans>}
            sub={<Trans>Описание, адрес, как найти, график, контакты</Trans>}
          />
          <SettingsRow
            to="/shop/categories"
            icon="tag"
            title={<Trans>Категории и свойства</Trans>}
            sub={
              <>
                <Plural
                  value={categoryCount}
                  _0="Категорий пока нет"
                  one="# категория"
                  few="# категории"
                  other="# категорий"
                />
                {attributes.length > 0 && ` · ${attributes.map((attribute) => attribute.name).join(', ')}`}
              </>
            }
          />
          <SettingsRow
            to="/shop/stock"
            icon="eye"
            title={<Trans>Наличие на витрине</Trans>}
            sub={
              shop.stockDisplay === 'levels' ? (
                <Trans>«есть / мало / нет», мало — {threshold} и меньше</Trans>
              ) : (
                <Trans>числом, мало — {threshold} и меньше</Trans>
              )
            }
          />
        </nav>
      </div>
      <PublishedSheet open={published} onClose={() => setPublished(false)} />
      <Toast message={message} onHide={hideMessage} />
    </>
  );
}
