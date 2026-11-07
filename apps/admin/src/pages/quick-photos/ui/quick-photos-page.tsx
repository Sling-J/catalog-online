import type { Product } from '@catalog/contract';
import { formatPrice, Icon } from '@catalog/ui';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { QuickBoard, useProductPhotos } from '@/features/product-photos';
import { invalidateProducts, productQueryOptions } from '@/entities/product';
import { ButtonLink } from '@/shared/ui';

import { quickQueueQueryOptions } from '../api';

/**
 * Быстрый режим «Добавить фото» (A3, макет AdminPhone, экран 4): очередь товаров без фото, по одному на экран —
 * снял, «Дальше →». Сверху «✕» (в «Товары»), «N из M», «Пропустить» и полоса прогресса. Очередь снимается
 * при входе и не меняется, пока снимают. Когда очередь кончилась (или её не было) — «Готово» (A25, макета нет).
 */
export function QuickPhotosPage() {
  const { data: queue } = useSuspenseQuery(quickQueueQueryOptions());
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(0);
  const item = queue[index];
  const next = queue[index + 1];

  // следующий товар подгружаем заранее, чтобы «Дальше» не мигало
  useEffect(() => {
    if (next) void queryClient.prefetchQuery(productQueryOptions(next.id));
  }, [next, queryClient]);
  // вышли из режима — счётчики и списки перечитать
  useEffect(() => () => void invalidateProducts(queryClient), [queryClient]);

  if (!item) return <Finished done={done} />;

  const advance = (added: boolean) => {
    if (added) setDone((count) => count + 1);
    setIndex((current) => current + 1);
  };
  const price = formatPrice(item.price);
  return (
    <div className="mx-auto max-w-[430px]">
      <Header position={index + 1} total={queue.length} onSkip={() => advance(false)} />
      <div className="mx-4 mt-3 h-2 overflow-hidden rounded-full bg-chip-haze">
        <div
          className="h-full rounded-full bg-mint transition-[width] duration-300"
          style={{ width: `${Math.round(((index + 1) / queue.length) * 100)}%` }}
        />
      </div>
      <div className="px-4 pt-[18px]">
        <div className="text-[13px] text-ink-quiet">
          {[item.category?.name, item.sku && `арт. ${item.sku}`].filter(Boolean).join(' · ')}
        </div>
        <h2 className="mt-0.5 text-[24px] font-extrabold tracking-[-0.02em]">{item.name}</h2>
        <div className="mt-1 text-[14px] text-ink-soft">
          <Plural value={item.variantCount} one="# вариант" few="# варианта" other="# вариантов" />
          {' · '}
          {item.priceVaries ? <Trans>от {price}</Trans> : price}
        </div>
      </div>
      {/* ключ — товар: фото и ошибки начинаются заново */}
      <Board key={item.id} productId={item.id} last={!next} onNext={advance} />
    </div>
  );
}

function Header({ position, total, onSkip }: { position: number; total: number; onSkip: () => void }) {
  const { t } = useLingui();
  return (
    <div className="flex items-center gap-2.5 px-4 pt-3.5">
      <Link
        to="/products"
        aria-label={t`Закрыть`}
        className="press flex size-11 flex-none items-center justify-center rounded-full bg-chip-haze hover:bg-haze-hover"
      >
        <Icon name="close" size={18} strokeWidth={2.4} />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="text-[15px] font-bold">
          <Trans>Фото товаров</Trans>
        </h1>
        <div className="text-[13px] text-ink-quiet">
          <Trans>
            {position} из {total}
          </Trans>
        </div>
      </div>
      <button type="button" onClick={onSkip} className="h-11 px-1 text-[14px] font-semibold text-ink-quiet">
        <Trans>Пропустить</Trans>
      </button>
    </div>
  );
}

/** Фото одного товара: пока товар не пришёл — серые плитки на месте обложки. */
function Board({ productId, last, onNext }: { productId: string; last: boolean; onNext: (added: boolean) => void }) {
  const { data: product } = useQuery(productQueryOptions(productId));
  if (!product) {
    return (
      <div className="flex gap-2 px-4 pt-4" aria-busy="true">
        <div className="size-[230px] rounded-[24px] bg-chip-haze" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex-1 rounded-[20px] bg-chip-haze" />
          <div className="flex-1 rounded-[20px] bg-chip-haze" />
        </div>
      </div>
    );
  }
  return <LoadedBoard product={product} last={last} onNext={onNext} />;
}

function LoadedBoard({ product, last, onNext }: { product: Product; last: boolean; onNext: (added: boolean) => void }) {
  const photos = useProductPhotos(product);
  return <QuickBoard photos={photos} busy={photos.busy} last={last} onNext={() => onNext(photos.tiles.length > 0)} />;
}

function Finished({ done }: { done: number }) {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-[430px] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-mint text-mint-ink">
        <Icon name="check" size={30} strokeWidth={2.6} />
      </span>
      <h1 className="text-title">{done > 0 ? <Trans>Фото добавлены</Trans> : <Trans>Все товары с фото</Trans>}</h1>
      <p className="max-w-[320px] text-body text-ink-quiet">
        {done > 0 ? (
          <Plural
            value={done}
            one="Добавили фото к # товару — теперь он виден на витрине."
            few="Добавили фото к # товарам — теперь они видны на витрине."
            other="Добавили фото к # товарам — теперь они видны на витрине."
          />
        ) : (
          <Trans>Очередь пуста: у каждого товара есть фото.</Trans>
        )}
      </p>
      <ButtonLink to="/products" variant="dark" className="mt-2 max-w-[320px]">
        <Trans>К товарам</Trans>
      </ButtonLink>
    </div>
  );
}
