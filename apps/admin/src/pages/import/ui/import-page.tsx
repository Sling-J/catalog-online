import { Trans } from '@lingui/react/macro';

import { PageTitle } from '@/shared/ui';

/** Раздел «Импорт» (FR-A3). Заглушка каркаса; мастер импорта — T-309. */
export function ImportPage() {
  return (
    <>
      <PageTitle>
        <Trans>Импорт</Trans>
      </PageTitle>
      <p className="mt-3 text-body text-ink-quiet">
        <Trans>Здесь можно будет загрузить Excel-выгрузку из учётной системы.</Trans>
      </p>
    </>
  );
}
