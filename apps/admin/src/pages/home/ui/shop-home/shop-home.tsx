import { getStatsOptions } from '@catalog/contract/query';
import { cx, formatAmount, Icon, type IconName } from '@catalog/ui';
import { Plural, Trans } from '@lingui/react/macro';
import { useInfiniteQuery, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link, type LinkProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { CopyLinkButton } from '@/features/copy-link';
import { ResendVerificationLink } from '@/features/resend-verification';
import { formatImportDate, importsQueryOptions } from '@/entities/import';
import { productCountsQueryOptions } from '@/entities/product';
import { meQueryOptions } from '@/entities/session';
import { shopQueryOptions, storefrontHost, storefrontUrl, StorefrontLink, whatsappShareUrl } from '@/entities/shop';

import { buildTodos, type TodoKey } from '@/pages/home/lib';

/**
 * Главная после запуска (UX-аудит, U6–U7; макета нет — по дизайн-системе): «что происходит и что сделать сейчас».
 * Ссылка на витрину с «Скопировать» и «Отправить в WhatsApp», неделя в цифрах с переходом в статистику и
 * «Нужно сделать» — без фото, нет в наличии, обновить остатки из Excel, подтвердить почту. Телефон — одна колонка,
 * компьютер — дела слева, витрина и неделя справа. Заблокированная витрина — пояснение вместо ссылки.
 */
export function ShopHome() {
  const { data: shop } = useSuspenseQuery(shopQueryOptions());
  const { data: me } = useSuspenseQuery(meQueryOptions());
  const { data: counts } = useSuspenseQuery(productCountsQueryOptions());
  const todos = buildTodos({
    emailVerified: me.account.emailVerified,
    noPhoto: counts.noPhoto,
    outOfStock: counts.outOfStock,
  });

  return (
    <div className="pt-1 pb-6 lg:pt-0">
      <h1 className="text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] lg:text-[30px] lg:leading-[normal]">
        <Trans>Главная</Trans>
      </h1>
      <div className="mt-4 flex flex-col gap-4 lg:mt-[22px] lg:grid lg:grid-cols-[minmax(0,560px)_360px] lg:items-start lg:gap-8">
        <div className="order-2 lg:order-1">
          <h2 className="text-[17px] font-extrabold">
            <Trans>Нужно сделать</Trans>
          </h2>
          <div className="mt-2.5 flex flex-col gap-2">
            {todos.map((key) => (
              <Todo
                key={key}
                todo={key}
                noPhoto={counts.noPhoto}
                outOfStock={counts.outOfStock}
                email={me.account.email}
              />
            ))}
          </div>
        </div>
        <div className="order-1 flex flex-col gap-4 lg:order-2">
          <StorefrontSummary status={shop.status} subdomain={shop.subdomain ?? null} />
          <WeekSummary />
        </div>
      </div>
    </div>
  );
}

function StorefrontSummary({
  status,
  subdomain,
}: {
  status: 'published' | 'draft' | 'blocked';
  subdomain: string | null;
}) {
  if (status === 'blocked') {
    return (
      <div className="rounded-[22px] bg-[#ffe6dd] p-4 text-[14px] leading-[1.5]">
        <div className="font-bold text-coral-underside">
          <Trans>Витрина заблокирована</Trans>
        </div>
        <p className="mt-1 text-ink-soft">
          <Trans>Покупатели её не видят. Напишите в поддержку — разберёмся.</Trans>
        </p>
      </div>
    );
  }
  if (!subdomain) return null;
  const url = storefrontUrl(subdomain, window.location.origin);
  return (
    <div className="rounded-[22px] bg-lilac-mist p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] font-semibold text-ink-quiet">
          <Trans>Ваша витрина</Trans>
        </div>
        <Link to="/shop" className="text-[13px] font-semibold text-iris hover:underline">
          <Trans>Публикация</Trans>
        </Link>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2.5">
        <StorefrontLink className="min-w-0 truncate text-[18px] font-extrabold hover:underline">
          {storefrontHost(url)}
        </StorefrontLink>
        <CopyLinkButton url={url} />
      </div>
      <a
        href={whatsappShareUrl(url)}
        target="_blank"
        rel="noreferrer"
        className="press mt-3 flex h-[42px] items-center justify-center gap-2 rounded-[14px] bg-white text-[14px] font-semibold hover:bg-lilac-hover"
      >
        <Icon name="whatsapp" size={17} />
        <Trans>Отправить ссылку в WhatsApp</Trans>
      </a>
    </div>
  );
}

/** Неделя в цифрах: просмотры и «Заказать»; не ждём — пока грузится, плитки-заглушки. */
function WeekSummary() {
  const { data: stats } = useQuery(getStatsOptions({ query: { period: '7d' } }));
  return (
    <Link
      to="/stats"
      className="block rounded-[22px] bg-white p-4 shadow-[0_1px_0_#eceaf5] hover:shadow-[0_1px_0_#eceaf5,0_6px_16px_rgb(40_30_110/0.06)]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] font-bold">
          <Trans>За неделю</Trans>
        </span>
        <span className="flex items-center gap-0.5 text-[13px] font-semibold text-iris">
          <Trans>Статистика</Trans>
          <Icon name="chevron-right" size={15} strokeWidth={2.4} />
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <Tile tone="bg-[#ece9ff] text-[#2a2290]" value={stats?.totals.views} label={<Trans>просмотров</Trans>} />
        <Tile
          tone="bg-mint-soft text-mint-ink"
          value={stats?.totals.orderClicks}
          label={<Trans>нажали «Заказать»</Trans>}
        />
      </div>
    </Link>
  );
}

function Tile({ tone, value, label }: { tone: string; value: number | undefined; label: ReactNode }) {
  return (
    <div className={cx('rounded-[16px] px-3 py-2.5', tone)}>
      {value === undefined ? (
        <div className="h-[30px] w-12 animate-pulse rounded-lg bg-white/50" />
      ) : (
        <div className="text-[24px] font-extrabold tabular-nums">{formatAmount(value)}</div>
      )}
      <div className="text-[12px] font-semibold">{label}</div>
    </div>
  );
}

function Todo({
  todo,
  noPhoto,
  outOfStock,
  email,
}: {
  todo: TodoKey;
  noPhoto: number;
  outOfStock: number;
  email: string;
}) {
  switch (todo) {
    case 'email':
      return (
        <TodoCard
          icon="mail"
          title={<Trans>Подтвердите почту</Trans>}
          sub={<Trans>Письмо на {email} — без этого не восстановить пароль</Trans>}
          extra={
            <ResendVerificationLink className="flex-none text-[14px]">
              <Trans>Ещё раз</Trans>
            </ResendVerificationLink>
          }
        />
      );
    case 'no_photo':
      return (
        <TodoCard
          icon="camera"
          to="/products/photos"
          title={<Plural value={noPhoto} one="# товар без фото" few="# товара без фото" other="# товаров без фото" />}
          sub={<Trans>Покупатели их не видят — снимите по очереди</Trans>}
          action={<Trans>Снять →</Trans>}
        />
      );
    case 'out_of_stock':
      return (
        <TodoCard
          icon="tag"
          to="/products"
          search={{ filter: 'out_of_stock' }}
          title={
            <Plural
              value={outOfStock}
              one="# товар закончился"
              few="# товара закончились"
              other="# товаров закончились"
            />
          }
          sub={<Trans>Пополните остатки или скройте с витрины</Trans>}
          action={<Trans>Открыть →</Trans>}
        />
      );
    case 'import':
      return <ImportTodo />;
  }
}

function ImportTodo() {
  const { data } = useInfiniteQuery(importsQueryOptions());
  const last = data?.pages[0]?.items.find((item) => item.status === 'done');
  return (
    <TodoCard
      icon="upload"
      to="/import"
      title={<Trans>Обновить остатки и цены из Excel</Trans>}
      sub={
        last ? (
          <Trans>Последний раз — {formatImportDate(last.createdAt)}</Trans>
        ) : (
          <Trans>Загрузите свежую выгрузку из учётной системы</Trans>
        )
      }
      action={<Trans>Загрузить →</Trans>}
    />
  );
}

/** Карточка дела: значок, что не так, как исправить; вся карточка — ссылка на нужный экран. */
function TodoCard({
  icon,
  to,
  search,
  title,
  sub,
  action,
  extra,
}: {
  icon: IconName;
  to?: LinkProps['to'];
  search?: Record<string, string>;
  title: ReactNode;
  sub: ReactNode;
  action?: ReactNode;
  extra?: ReactNode;
}) {
  const body = (
    <>
      <span className="flex size-10 flex-none items-center justify-center rounded-[13px] bg-lilac-mist">
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold">{title}</span>
        <span className="block text-[13px] text-ink-quiet">{sub}</span>
      </span>
      {action && <span className="flex-none text-[14px] font-bold text-iris">{action}</span>}
      {extra}
    </>
  );
  const card = 'flex items-center gap-3 rounded-[20px] bg-white p-3.5 shadow-[0_1px_0_#eceaf5]';
  return to ? (
    <Link to={to} search={search} className={cx(card, 'hover:bg-[#f8f7fd]')}>
      {body}
    </Link>
  ) : (
    <div className={card}>{body}</div>
  );
}
