import { Trans } from '@lingui/react/macro';

import { useDownloadTemplate } from '../../hooks';
import { TextAction } from '../text-action';

/** «Скачать шаблон» (FR-A3): Excel с нужными колонками и примером строки. */
export function TemplateLink({ className }: { className?: string }) {
  const download = useDownloadTemplate();
  return (
    <TextAction className={className} disabled={download.isPending} onClick={() => download.mutate()}>
      {download.isError ? <Trans>Не скачалось — ещё раз</Trans> : <Trans>Скачать шаблон</Trans>}
    </TextAction>
  );
}
