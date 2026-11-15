import type { StaffShopItem } from '@catalog/contract';
import { Button, Icon } from '@catalog/ui';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { ShopStatus, shopsQueryOptions } from '@/entities/shop';
import { BlockButton, ImpersonateButton, UnblockButton } from '@/features/shop-actions';

const SEARCH_DELAY_MS = 300;
const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
const number = new Intl.NumberFormat('ru-RU');

/**
 * Список магазинов (FR-S1–S3, ADR 0005): поиск по названию, адресу и почте, цифры и действия в строке. Компьютер —
 * таблицей, телефон — карточками. Поиск — в адресе страницы (`?q=`), чтобы его можно было обновить и переслать.
 */
export function ShopsPage({
  email,
  q,
  onSearch,
  onLogout,
}: {
  email: string;
  q: string;
  onSearch: (q: string) => void;
  onLogout: () => void;
}) {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(shopsQueryOptions(q));
  const shops = data.pages.flatMap((page) => page.items);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-[#eceaf5] bg-white">
        <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-4 py-3 lg:px-6">
          <span className="flex-1 text-[17px] font-extrabold">Суперадминка</span>
          <span className="hidden text-[14px] text-ink-quiet sm:inline">{email}</span>
          <Button variant="soft" size="small" onClick={onLogout}>
            Выйти
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-4 py-5 lg:px-6 lg:py-7">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="flex-1 text-[24px] font-extrabold tracking-[-0.01em]">Магазины</h1>
          <SearchInput value={q} onChange={onSearch} />
        </div>

        {shops.length === 0 ? (
          <p className="mt-10 text-center text-[15px] text-ink-quiet">
            {q ? 'Ничего не нашлось' : 'Магазинов пока нет'}
          </p>
        ) : (
          <div className="mt-5 overflow-hidden rounded-[22px] bg-white lg:border lg:border-[#eceaf5]">
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_130px_110px_80px_110px_auto] gap-4 border-b border-[#eceaf5] px-5 py-3 text-[12px] font-semibold text-ink-quiet lg:grid">
              <span>Магазин</span>
              <span>Почта</span>
              <span>Статус</span>
              <span>Создан</span>
              <span className="text-right">Товаров</span>
              <span className="text-right" title="Нажатий «Заказать» за 30 дней">
                Заказов, 30 дн.
              </span>
              <span className="w-[300px]" />
            </div>
            <ul className="flex flex-col gap-2.5 lg:gap-0">
              {shops.map((shop) => (
                <ShopRow key={shop.id} shop={shop} />
              ))}
            </ul>
          </div>
        )}

        {hasNextPage && (
          <div className="mt-5 flex justify-center">
            <Button variant="soft" size="state" onClick={() => void fetchNextPage()} disabled={isFetchingNextPage}>
              Показать ещё
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function ShopRow({ shop }: { shop: StaffShopItem }) {
  const name = shop.name ?? 'Без названия';
  return (
    <li
      aria-label={name}
      className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-[18px] border border-[#eceaf5] p-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_130px_110px_80px_110px_auto] lg:items-center lg:rounded-none lg:border-0 lg:border-b lg:px-5 lg:py-3 lg:last:border-b-0"
    >
      <div className="col-span-2 min-w-0 lg:col-span-1">
        <p className="truncate text-[15px] font-bold">{name}</p>
        <p className="truncate text-[13px] text-ink-quiet">{shop.subdomain ?? 'адрес не выбран'}</p>
      </div>
      <p className="col-span-2 truncate text-[14px] lg:col-span-1">{shop.email ?? '—'}</p>
      <ShopStatus status={shop.status} />
      <p className="text-[14px] text-ink-quiet">{dateFormat.format(new Date(shop.createdAt))}</p>
      <p className="text-[14px] tabular-nums lg:text-right">
        <span className="text-ink-quiet lg:hidden">Товаров: </span>
        {number.format(shop.productCount)}
      </p>
      <p className="text-[14px] tabular-nums lg:text-right">
        <span className="text-ink-quiet lg:hidden">Заказов за 30 дн.: </span>
        {number.format(shop.orderClicks30d)}
      </p>
      <div className="col-span-2 flex flex-wrap items-center gap-2 lg:col-span-1 lg:w-[300px] lg:justify-end">
        <ImpersonateButton shopId={shop.id} name={name} />
        {shop.status === 'blocked' ? (
          <UnblockButton shopId={shop.id} name={name} />
        ) : (
          <BlockButton shopId={shop.id} name={name} />
        )}
      </div>
    </li>
  );
}

/** Поиск ждёт паузу в наборе, чтобы не слать запрос на каждую букву. */
function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (text.trim() === value) return;
    const id = setTimeout(() => onChange(text.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [text, value, onChange]);
  return (
    <label className="flex h-11 w-full items-center gap-2 rounded-field border-[1.5px] border-[#e2dff0] bg-white px-3.5 focus-within:border-ink-night sm:w-[340px]">
      <Icon name="search" size={18} className="flex-none text-ink-muted" />
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Название, адрес или почта"
        aria-label="Поиск магазинов"
        className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-muted"
      />
    </label>
  );
}
