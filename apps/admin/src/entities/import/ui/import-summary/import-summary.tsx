import type { Import } from '@catalog/contract';
import { Plural, Trans } from '@lingui/react/macro';
import { Fragment, type ReactNode } from 'react';

/** Итог применённого импорта одной строкой: «12 новых · 203 обновлено · 4 обнулено · 3 с ошибками», нули — без них. */
export function ImportSummary({ result }: { result: NonNullable<Import['result']> }) {
  const parts: [number, ReactNode][] = [
    [result.created, <Plural key="c" value={result.created} one="# новый" other="# новых" />],
    [result.updated, <Trans key="u">{result.updated} обновлено</Trans>],
    [result.zeroed, <Trans key="z">{result.zeroed} обнулено</Trans>],
    [result.skipped, <Trans key="s">{result.skipped} с ошибками</Trans>],
  ];
  const shown = parts.filter(([count]) => count > 0);
  if (shown.length === 0) return <Trans>без изменений</Trans>;
  // число и слово не разрываем: «3 / обнулено» на разных строках не читается
  return shown.map(([, text], index) => (
    <Fragment key={index}>
      {index > 0 && ' · '}
      <span className="whitespace-nowrap">{text}</span>
    </Fragment>
  ));
}
