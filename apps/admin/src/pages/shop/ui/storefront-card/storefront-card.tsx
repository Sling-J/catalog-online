import type { ShopStatus } from '@catalog/contract';
import { cx, Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import { PublishAgain, UnpublishShop } from '@/features/publish-shop';
import { storefrontHost } from '@/entities/shop';

const tones: Record<ShopStatus, { pill: string; dot: string }> = {
  published: { pill: 'bg-mint-soft text-mint-ink', dot: 'bg-stock-in' },
  draft: { pill: 'bg-[#fff1d6] text-[#7a4300]', dot: 'bg-[#e8a100]' },
  blocked: { pill: 'bg-[#ffe6dd] text-coral-underside', dot: 'bg-coral-underside' },
};

// кнопки карточки — не пилюли, а скругление 14 px, без подложки (макет AdminPhone2, экран 8)
const button = 'press flex h-[42px] items-center justify-center gap-1.5 rounded-[14px] text-[14px]';

/**
 * Карточка витрины в разделе «Магазин» (FR-A9; макет AdminPhone2, экран 8 — опубликованная): адрес, «Скопировать
 * ссылку», «Снять». Снятая и заблокированная — в макете нет, сделаны в коде так же: «Опубликовать» вместо «Снять»;
 * у заблокированной кнопок нет, только пояснение.
 */
export function StorefrontCard({ status, url }: { status: ShopStatus; url: string | null }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div className="mt-3.5 rounded-[22px] bg-lilac-mist p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] font-semibold text-ink-quiet">
          {status === 'published' && <Trans>Витрина опубликована</Trans>}
          {status === 'draft' && <Trans>Витрина скрыта</Trans>}
          {status === 'blocked' && <Trans>Витрина заблокирована</Trans>}
        </div>
        <span
          className={cx(
            'inline-flex h-[26px] flex-none items-center gap-1.5 rounded-pill px-2.5 text-[12px] font-bold whitespace-nowrap',
            tones[status].pill,
          )}
        >
          <span aria-hidden="true" className={cx('size-2 rounded-full', tones[status].dot)} />
          {status === 'published' && <Trans>Видна всем</Trans>}
          {status === 'draft' && <Trans>Черновик</Trans>}
          {status === 'blocked' && <Trans>Не видна</Trans>}
        </span>
      </div>
      {url && <div className="mt-1.5 truncate text-[18px] font-extrabold">{storefrontHost(url)}</div>}
      {status === 'blocked' ? (
        <p className="mt-2 text-[13px] leading-[1.5] text-ink-quiet">
          <Trans>Покупатели её не видят. Напишите в поддержку — разберёмся.</Trans>
        </p>
      ) : (
        url && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(url).then(() => setCopied(true))}
              className={cx(button, 'flex-1 bg-ink-night font-bold text-white hover:bg-ink-hover')}
            >
              <span key={String(copied)} className="flex items-center gap-1.5 motion-safe:animate-swap">
                <Icon name={copied ? 'check' : 'copy-square'} size={16} strokeWidth={copied ? 2.6 : 2} />
                {copied ? <Trans>Скопировано</Trans> : <Trans>Скопировать ссылку</Trans>}
              </span>
            </button>
            {status === 'published' ? (
              <UnpublishShop className={cx(button, 'bg-white px-3.5 font-semibold hover:bg-lilac-hover')} />
            ) : (
              <PublishAgain className={cx(button, 'bg-white px-3.5 font-semibold hover:bg-lilac-hover')} />
            )}
          </div>
        )
      )}
    </div>
  );
}
