import { Trans } from '@lingui/react/macro';

import { PageTitle } from '@/shared/ui';

/** Раздел «Товары» (FR-A5). Заглушка каркаса; список товаров — T-305. */
export function ProductsPage() {
  return (
    <>
      <PageTitle>
        <Trans>Товары</Trans>
      </PageTitle>
      <p className="mt-3 text-body text-ink-quiet">
        <Trans>Здесь будет список товаров: поиск, вкладки и массовые действия.</Trans>
      </p>
    </>
  );
}
