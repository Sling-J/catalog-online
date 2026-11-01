import { Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { ClayBlock, StateScreen } from '@/shared/ui';

/**
 * «Не найдено». `product` — адрес магазина есть, но товара по ссылке нет (скрыт или удалён): ведём в каталог.
 * Без него — чужой или неизвестный адрес, магазина с таким именем нет.
 */
export function NotFoundPage({ product }: { product?: boolean }) {
  return (
    <main className="min-h-dvh bg-paper font-sans text-ink-night">
      {product ? (
        <StateScreen
          object={<ClayBlock tone="coral" rotate={-8} label="404" />}
          title={<Trans>Такого товара нет</Trans>}
          description={
            <Trans>Ссылка устарела: магазин убрал этот товар. Загляните в каталог — там много другого.</Trans>
          }
        >
          <Link
            to="/"
            className="inline-flex h-[50px] items-center justify-center rounded-pill bg-ink-night px-[22px] text-[15px] font-bold text-white shadow-press-ink lg:h-[52px] lg:px-6"
          >
            <Trans>Открыть каталог</Trans>
          </Link>
        </StateScreen>
      ) : (
        <StateScreen
          object={<ClayBlock label="?" />}
          title={<Trans>Магазин не найден</Trans>}
          description={<Trans>Проверьте адрес: возможно, в нём опечатка или магазин переехал на другой адрес.</Trans>}
        />
      )}
    </main>
  );
}
