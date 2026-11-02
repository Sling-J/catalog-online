import { Icon } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

/** «Поделиться»: системное окно, где оно есть, иначе копируем ссылку. Превью с фото и ценой — Open Graph (T-111). */
export function ShareButton({ title, className }: { title: string; className?: string }) {
  const { t } = useLingui();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {
      // окно закрыли или буфер недоступен — ничего страшного
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? t`Ссылка скопирована` : t`Поделиться`}
      className={className}
    >
      <Icon name={copied ? 'check' : 'share'} />
    </button>
  );
}
