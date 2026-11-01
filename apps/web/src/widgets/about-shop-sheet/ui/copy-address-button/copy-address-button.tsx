import { Trans } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import { Icon } from '@/shared/ui';

/** «Скопировать адрес»: на секунду меняется на «Скопировано». Без доступа к буферу не делает ничего. */
export function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      // буфер недоступен (не https, запрет браузера) — адрес всё равно виден на экране
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-white text-[14px] font-semibold"
    >
      <Icon name={copied ? 'check' : 'copy'} size={16} />
      {copied ? <Trans>Скопировано</Trans> : <Trans>Скопировать адрес</Trans>}
    </button>
  );
}
