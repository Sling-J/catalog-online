import { Trans } from '@lingui/react/macro';

import { BackBar, PageTitle } from '@/shared/ui';

/** Новый товар вручную (FR-A5). Заглушка; редактор — T-306. */
export function NewProductPage() {
  return (
    <>
      <BackBar to="/products">
        <Trans>Новый товар</Trans>
      </BackBar>
      <div className="px-4 pt-4 lg:px-0 lg:pt-0">
        <div className="hidden lg:block">
          <PageTitle>
            <Trans>Новый товар</Trans>
          </PageTitle>
        </div>
        <p className="text-body text-ink-quiet lg:mt-3">
          <Trans>Здесь будет карточка нового товара: фото, название, размеры, цена и количество.</Trans>
        </p>
      </div>
    </>
  );
}
