import { Trans } from '@lingui/react/macro';
import { cx } from '@catalog/ui';
import { useEffect, useState } from 'react';

/** «Скопировать адрес»: на секунду меняется на «Скопировано». Без доступа к буферу не делает ничего. */
export function CopyAddressButton({ address, className }: { address: string; className?: string }) {
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
      className={cx('flex flex-1 items-center justify-center rounded-[14px] text-[14px] font-semibold', className)}
    >
      <span key={String(copied)} className="motion-safe:animate-swap">
        {copied ? <Trans>Скопировано</Trans> : <Trans>Скопировать адрес</Trans>}
      </span>
    </button>
  );
}
