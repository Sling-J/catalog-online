import type { Import } from '@catalog/contract';
import { Button, cx, Icon, useLoadMore } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { formatImportDate, importsQueryOptions, ImportSummary, isImportOpen } from '@/entities/import';
import { BackBar, ButtonLink } from '@/shared/ui';

const CARD =
  'rounded-[20px] bg-white shadow-[0_1px_0_#eceaf5] lg:rounded-[22px] lg:shadow-[0_1px_0_#eceaf5,0_6px_16px_rgb(40_30_110/0.05)]';

function StatusPill({ item }: { item: Import }) {
  const [tone, label]: [string, ReactNode] =
    item.status === 'done'
      ? ['bg-mint-soft text-mint-ink', <Trans key="d">загружен</Trans>]
      : item.status === 'failed'
        ? ['bg-[#ffe9e1] text-[#8a2e12]', <Trans key="f">не прочитан</Trans>]
        : item.status === 'cancelled'
          ? ['bg-chip-haze text-ink-muted', <Trans key="c">отменён</Trans>]
          : ['bg-[#fff1d6] text-[#7a4300]', <Trans key="o">не закончен</Trans>];
  return (
    <span
      className={cx(
        'inline-flex h-[26px] flex-none items-center rounded-pill px-2.5 text-[12px] font-bold whitespace-nowrap',
        tone,
      )}
    >
      {label}
    </span>
  );
}

function Row({ item }: { item: Import }) {
  const body = (
    <>
      <Icon name="file" size={22} className="flex-none text-stock-in" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold">{item.fileName}</span>
        <span className="block text-[13px] text-ink-quiet">
          {formatImportDate(item.createdAt)}
          {item.result && (
            <>
              {' · '}
              <ImportSummary result={item.result} />
            </>
          )}
          {isImportOpen(item.status) && (
            <>
              {' · '}
              <Trans>продолжить</Trans>
            </>
          )}
        </span>
      </span>
      <StatusPill item={item} />
    </>
  );
  const row = 'flex items-center gap-3 border-t border-[#f0eef7] px-3.5 py-3 first:border-t-0 lg:px-[18px] lg:py-3.5';
  // отменённый открыть нельзя — раздел сразу вернётся к выбору файла
  if (item.status === 'cancelled') return <li className={row}>{body}</li>;
  return (
    <li className="border-t border-[#f0eef7] first:border-t-0">
      <Link to="/import" search={{ id: item.id }} className={cx(row, 'border-t-0 hover:bg-[#f8f7fd]')}>
        {body}
      </Link>
    </li>
  );
}

/**
 * «История импортов» (FR-A3, макета нет): дата, файл, итог и состояние, новые сверху, подгрузка при прокрутке.
 * Применённый, непрочитанный и незаконченный импорт открываются в разделе «Импорт». Телефон — вложенный экран
 * с «Назад», компьютер — путь «Импорт / История импортов», как «Вход и пароль».
 */
export function ImportHistoryPage() {
  const { data, error, isPending, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(importsQueryOptions());
  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const marker = useLoadMore(() => void fetchNextPage(), hasNextPage && !isFetchingNextPage, data?.pages.length ?? 0);

  let content: ReactNode;
  if (isPending) {
    content = (
      <div aria-busy="true" className={cx(CARD, 'flex flex-col gap-3 p-4')}>
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-11 rounded-xl bg-chip-haze" />
        ))}
      </div>
    );
  } else if (error && items.length === 0) {
    content = (
      <div className="text-center">
        <p className="text-[15px] text-ink-quiet">
          <Trans>Не получилось загрузить историю.</Trans>
        </p>
        <Button variant="soft" size="md" className="mt-3" onClick={() => void refetch()}>
          <Trans>Повторить</Trans>
        </Button>
      </div>
    );
  } else if (items.length === 0) {
    content = (
      <div className="flex flex-col items-center pt-10 text-center">
        <h2 className="text-title">
          <Trans>Импортов пока не было</Trans>
        </h2>
        <p className="mt-2 max-w-[320px] text-[15px] text-ink-quiet">
          <Trans>Загрузите Excel или выгрузку из учётной программы — здесь появится итог.</Trans>
        </p>
        <ButtonLink to="/import" variant="primary" className="mt-5 max-w-[320px]">
          <Trans>Загрузить файл</Trans>
        </ButtonLink>
      </div>
    );
  } else {
    content = (
      <>
        <ul className={CARD}>
          {items.map((item) => (
            <Row key={item.id} item={item} />
          ))}
        </ul>
        <div ref={marker} />
      </>
    );
  }

  return (
    <>
      <BackBar to="/import">
        <Trans>История импортов</Trans>
      </BackBar>
      <div className="hidden lg:block">
        <div className="text-[14px] text-ink-quiet">
          <Link to="/products">
            <Trans>Товары</Trans>
          </Link>{' '}
          /{' '}
          <Link to="/import">
            <Trans>Импорт</Trans>
          </Link>{' '}
          / <Trans>История импортов</Trans>
        </div>
        <h1 className="mt-1.5 text-[30px] font-extrabold tracking-[-0.03em]">
          <Trans>История импортов</Trans>
        </h1>
      </div>
      <div className="px-4 pt-4 lg:mt-[18px] lg:w-[720px] lg:p-0">{content}</div>
    </>
  );
}
