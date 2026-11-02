import { Trans } from '@lingui/react/macro';

import { PageTitle } from '@/shared/ui';

/** Раздел «Магазин»: публикация, настройки, статистика. Заглушка каркаса; экраны — в своих задачах E3. */
export function ShopPage() {
  return (
    <>
      <PageTitle>
        <Trans>Магазин</Trans>
      </PageTitle>
      <p className="mt-3 text-body text-ink-quiet">
        <Trans>Здесь будут публикация, настройки магазина и статистика.</Trans>
      </p>
    </>
  );
}
