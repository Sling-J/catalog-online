import { Trans } from '@lingui/react/macro';

import type { ProductListParams } from '@/entities/product';

import { StateBlock } from '../state-block';

/**
 * Что показать вместо строк (доска AdminProductsStates): ошибка загрузки с «Повторить», «Ничего не нашлось»
 * по поиску с «Сбросить поиск», пустая вкладка («У всех товаров есть фото» и т. п.) или пустая категория.
 */
export function ListState({
  params,
  failed,
  onRetry,
  onResetSearch,
  className,
}: {
  params: ProductListParams;
  failed: boolean;
  onRetry: () => void;
  onResetSearch: () => void;
  className?: string;
}) {
  if (failed) {
    return (
      <StateBlock
        className={className}
        tone="error"
        title={<Trans>Не получилось загрузить товары</Trans>}
        text={<Trans>Проверьте интернет и попробуйте ещё раз.</Trans>}
        action={{ label: <Trans>Повторить</Trans>, onClick: onRetry, dark: true }}
      />
    );
  }
  if (params.q) {
    const q = params.q;
    return (
      <StateBlock
        className={className}
        tone="search"
        title={<Trans>Ничего не нашлось</Trans>}
        text={<Trans>По запросу «{q}» товаров нет. Ищем по названию, артикулу и штрихкоду.</Trans>}
        action={{ label: <Trans>Сбросить поиск</Trans>, onClick: onResetSearch }}
      />
    );
  }
  if (params.filter === 'no_photo') {
    return (
      <StateBlock
        className={className}
        tone="done"
        title={<Trans>У всех товаров есть фото</Trans>}
        text={<Trans>Покупатели видят каждый товар на витрине.</Trans>}
      />
    );
  }
  if (params.filter === 'out_of_stock') {
    return (
      <StateBlock
        className={className}
        tone="done"
        title={<Trans>Всё в наличии</Trans>}
        text={<Trans>Закончившихся товаров нет.</Trans>}
      />
    );
  }
  if (params.filter === 'hidden') {
    return (
      <StateBlock
        className={className}
        tone="done"
        title={<Trans>Скрытых товаров нет</Trans>}
        text={<Trans>Все товары видны на витрине.</Trans>}
      />
    );
  }
  return (
    <StateBlock
      className={className}
      tone="empty"
      title={<Trans>В этой категории пока нет товаров</Trans>}
      text={<Trans>Выберите другую категорию или перенесите товары сюда.</Trans>}
    />
  );
}
