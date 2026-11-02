import { cx, Icon } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

/** Квадратная кнопка «Скопировать ссылку»; после копирования на две секунды показывает галочку. */
export function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  const { t } = useLingui();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    void navigator.clipboard.writeText(url).then(() => setCopied(true));
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? t`Ссылка скопирована` : t`Скопировать ссылку`}
      className={cx(
        'flex size-9 flex-none items-center justify-center rounded-xl bg-white hover:bg-lilac-hover',
        className,
      )}
    >
      <Icon name={copied ? 'check' : 'copy-square'} size={16} strokeWidth={copied ? 2.6 : 2} />
    </button>
  );
}
