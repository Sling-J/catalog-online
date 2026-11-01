import { Button } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useInfiniteQuery, useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { productFacetsQueryOptions, productsQueryOptions, ProductTile } from '@/entities/product';
import type { ProductListParams } from '@/entities/product';
import { shopQueryOptions } from '@/entities/shop';
import { AskInWhatsApp } from '@/features/ask-in-whatsapp';
import { getActiveValueFilters } from '@/features/product-filters';
import { ClayBlock, StateScreen } from '@/shared/ui';

/**
 * Пустая выборка. Три случая: поиск ничего не нашёл («Сбросить поиск», «Спросить в WhatsApp»),
 * фильтры слишком строгие («Убрать фильтр» и подборка из других категорий) и магазин без товаров.
 */
export function EmptyState({
  subdomain,
  params,
  hasFilters,
  onResetQuery,
  onResetFilters,
  onShowAllCategories,
}: {
  subdomain: string;
  params: ProductListParams;
  /** Включены ли поиск или фильтры. */
  hasFilters: boolean;
  onResetQuery: () => void;
  onResetFilters: () => void;
  onShowAllCategories: () => void;
}) {
  const { t } = useLingui();
  const { data: shop } = useSuspenseQuery(shopQueryOptions(subdomain));
  const { data: all } = useSuspenseQuery(productFacetsQueryOptions(subdomain));

  if (params.q) {
    const ask = t`Здравствуйте! Ищу «${params.q}» — есть ли у вас такое?`;
    return (
      <StateScreen
        object={<ClayBlock label="?" />}
        title={<Trans>По запросу «{params.q}» ничего нет</Trans>}
        description={
          <>
            <Trans>
              Проверьте написание или поищите по категориям. Возможно, у магазина есть похожее — спросите в WhatsApp
            </Trans>
            <span className="hidden lg:inline">
              <Trans>, сообщение уже будет готово</Trans>
            </span>
            .
          </>
        }
      >
        <Button size="state" onClick={onResetQuery}>
          <Trans>Сбросить поиск</Trans>
        </Button>
        {/* телефон: ссылка под кнопкой; компьютер: мятная кнопка рядом */}
        <AskInWhatsApp variant="link" phone={shop.whatsapp} message={ask} className="lg:hidden">
          <Trans>Спросить в WhatsApp</Trans>
        </AskInWhatsApp>
        <AskInWhatsApp phone={shop.whatsapp} message={ask} className="hidden lg:inline-flex">
          <Trans>Спросить в WhatsApp</Trans>
        </AskInWhatsApp>
      </StateScreen>
    );
  }

  if (hasFilters) {
    // один фильтр по значению называем по имени («Рост 128»), несколько — общими словами
    const chosen = getActiveValueFilters(all, params.values ?? []);
    const single = chosen.length === 1 && params.priceMin === undefined && params.priceMax === undefined;
    const label = single ? `${chosen[0]!.attributeName} ${chosen[0]!.value}` : undefined;
    const short = single && chosen[0]!.value.length <= 4 ? chosen[0]!.value : '0';
    return (
      <div className="lg:mx-auto lg:mt-[30px] lg:flex lg:max-w-[1200px] lg:items-center lg:gap-14 lg:px-5">
        <StateScreen
          compact
          className="lg:w-[420px] lg:max-w-none lg:flex-none"
          object={<ClayBlock tone="coral" rotate={-8} label={short} />}
          title={
            label ? (
              <Trans>С фильтром «{label}» сейчас ничего нет</Trans>
            ) : (
              <Trans>С такими фильтрами сейчас ничего нет</Trans>
            )
          }
          description={<Trans>Уберите фильтр или посмотрите, что подходит в других категориях.</Trans>}
        >
          <Button size="state" onClick={onResetFilters}>
            {label ? <Trans>Убрать фильтр «{label}»</Trans> : <Trans>Убрать фильтры</Trans>}
          </Button>
        </StateScreen>
        {params.categoryId && (
          <OtherCategories subdomain={subdomain} params={params} label={label} onShowAll={onShowAllCategories} />
        )}
      </div>
    );
  }

  return (
    <StateScreen
      object={<ClayBlock tone="mint" rotate={6} label="…" />}
      title={<Trans>Здесь пока нет товаров</Trans>}
      description={<Trans>Загляните в другую категорию или напишите магазину.</Trans>}
    >
      <AskInWhatsApp phone={shop.whatsapp} message={t`Здравствуйте! Подскажите, что сейчас есть в наличии?`}>
        <Trans>Написать в WhatsApp</Trans>
      </AskInWhatsApp>
    </StateScreen>
  );
}

/** Что подходит под те же фильтры в других категориях (макет 2); на компьютере стоит справа от текста. */
function OtherCategories({
  subdomain,
  params,
  label,
  onShowAll,
}: {
  subdomain: string;
  params: ProductListParams;
  label: string | undefined;
  onShowAll: () => void;
}) {
  const others = { ...params, categoryId: undefined };
  const { data } = useInfiniteQuery(productsQueryOptions(subdomain, others));
  const { data: facets } = useQuery(productFacetsQueryOptions(subdomain, others));
  const cards = data?.pages.flatMap((page) => page.items).slice(0, 6) ?? [];
  if (cards.length === 0) return null;

  return (
    <section className="mt-[30px] lg:mt-0 lg:flex-1">
      <div className="flex items-baseline justify-between px-4 lg:mb-3 lg:px-0">
        <h2 className="text-[15px] font-bold lg:text-[18px] lg:font-extrabold">
          {label ? <Trans>«{label}» есть в других категориях</Trans> : <Trans>В других категориях есть</Trans>}
        </h2>
        {facets && (
          <button
            type="button"
            onClick={onShowAll}
            className="text-caption font-semibold text-iris hover:underline lg:text-[14px]"
          >
            <Trans>Все {facets.total} →</Trans>
          </button>
        )}
      </div>
      <ul className="mt-2.5 grid grid-cols-3 gap-0.5 lg:mt-0 lg:gap-2">
        {cards.map((card) => (
          <li key={card.id} className="lg:overflow-hidden lg:rounded-[14px]">
            <ProductTile card={card} />
          </li>
        ))}
      </ul>
    </section>
  );
}
