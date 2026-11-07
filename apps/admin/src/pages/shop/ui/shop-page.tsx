import { getStatsOptions } from '@catalog/contract/query';
import { Plural, Trans } from '@lingui/react/macro';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { LogoutButton } from '@/features/logout';
import { attributesQueryOptions } from '@/entities/attribute';
import { categoriesQueryOptions, flattenCategories } from '@/entities/category';
import { meQueryOptions } from '@/entities/session';
import { shopQueryOptions, storefrontUrl } from '@/entities/shop';
import { PageTitle } from '@/shared/ui';

import { SettingsRow } from './settings-row';
import { StorefrontCard } from './storefront-card';

/**
 * Раздел «Магазин» (FR-A9; макет AdminPhone2, экран 8): карточка витрины с публикацией, пункты настроек и «Выйти».
 * На компьютере макета нет — та же колонка шириной 560 px, как «Вход и пароль».
 */
export function ShopPage() {
  const { data: shop } = useSuspenseQuery(shopQueryOptions());
  const { data: me } = useSuspenseQuery(meQueryOptions());
  const { data: tree } = useSuspenseQuery(categoriesQueryOptions());
  const { data: attributes } = useSuspenseQuery(attributesQueryOptions());
  // статистика подписи не задерживает: пока не пришла — общая подпись
  const { data: stats } = useQuery(getStatsOptions({ query: { period: '7d' } }));
  const url = shop.subdomain ? storefrontUrl(shop.subdomain, window.location.origin) : null;
  const categoryCount = flattenCategories(tree).length;
  const threshold = shop.lowStockThreshold;

  return (
    <>
      <PageTitle>
        <Trans>Магазин</Trans>
      </PageTitle>
      <div className="lg:w-[560px]">
        <StorefrontCard status={shop.status} url={url} />
        <nav className="mt-3.5 overflow-hidden rounded-[22px] bg-white shadow-[0_1px_0_#eceaf5]">
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
            title={<Trans>Категории и размеры</Trans>}
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
            title={<Trans>Как показывать наличие</Trans>}
            sub={
              shop.stockDisplay === 'levels' ? (
                <Trans>«есть / мало / нет», мало — {threshold} и меньше</Trans>
              ) : (
                <Trans>числом, мало — {threshold} и меньше</Trans>
              )
            }
          />
          <SettingsRow
            to="/shop/stats"
            icon="chart"
            title={<Trans>Статистика</Trans>}
            sub={
              stats ? (
                <Trans>
                  За неделю:{' '}
                  <Plural value={stats.totals.views} one="# просмотр" few="# просмотра" other="# просмотров" />,{' '}
                  <Plural
                    value={stats.totals.orderClicks}
                    one="# нажатие «Заказать»"
                    few="# нажатия «Заказать»"
                    other="# нажатий «Заказать»"
                  />
                </Trans>
              ) : (
                <Trans>Просмотры и нажатия «Заказать»</Trans>
              )
            }
          />
          <SettingsRow to="/shop/account" icon="lock" title={<Trans>Вход и пароль</Trans>} sub={me.account.email} />
        </nav>
        <LogoutButton className="mt-4 block w-full text-center text-[15px] font-semibold text-coral-underside hover:underline" />
      </div>
    </>
  );
}
