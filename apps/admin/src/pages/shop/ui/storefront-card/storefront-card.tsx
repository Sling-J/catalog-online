import type { Shop, ShopStatus } from '@catalog/contract';
import { cx, Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';

import { PublishButton, UnpublishShop } from '@/features/publish-shop';
import { meQueryOptions } from '@/entities/session';
import { publishBlockers, storefrontHost, StorefrontLink, whatsappShareUrl } from '@/entities/shop';
import { useCopied } from '@/shared/hooks';

const tones: Record<ShopStatus, { pill: string; dot: string }> = {
  published: { pill: 'bg-mint-soft text-mint-ink', dot: 'bg-stock-in' },
  draft: { pill: 'bg-[#fff1d6] text-[#7a4300]', dot: 'bg-[#e8a100]' },
  blocked: { pill: 'bg-[#ffe6dd] text-coral-underside', dot: 'bg-coral-underside' },
};

// кнопки карточки — не пилюли, а скругление 14 px, без подложки (макет AdminPhone2, экран 8)
const button = 'press flex h-[42px] items-center justify-center gap-1.5 rounded-[14px] text-[14px]';

/**
 * Публикация — в одном месте (UX-аудит, D2, L4): карточка витрины в разделе «Магазин» (FR-A9; макет AdminPhone2,
 * экран 8 — опубликованная). Опубликованная: адрес, «Скопировать ссылку», «Снять», «Отправить ссылку в WhatsApp».
 * Черновик: адрес открывает превью, ниже та же «Опубликовать витрину», что на главной, со всеми причинами, если нельзя.
 * Заблокированная — только пояснение. После «Опубликовать» и «Снять» остаёмся здесь (U4).
 */
export function StorefrontCard({
  shop,
  url,
  onPublished,
  onUnpublished,
}: {
  shop: Shop;
  url: string | null;
  onPublished: () => void;
  onUnpublished: () => void;
}) {
  const { data: me } = useSuspenseQuery(meQueryOptions());
  const { status } = shop;
  const { copied, copy } = useCopied();

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
      {url && (
        <StorefrontLink className="mt-1.5 block truncate text-[18px] font-extrabold hover:underline">
          {storefrontHost(url)}
        </StorefrontLink>
      )}
      {status === 'blocked' && (
        <p className="mt-2 text-[13px] leading-[1.5] text-ink-quiet">
          <Trans>Покупатели её не видят. Напишите в поддержку — разберёмся.</Trans>
        </p>
      )}
      {status === 'published' && url && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copy(url)}
              className={cx(button, 'flex-1 bg-ink-night font-bold text-white hover:bg-ink-hover')}
            >
              <span key={String(copied)} className="flex items-center gap-1.5 motion-safe:animate-swap">
                <Icon name={copied ? 'check' : 'copy-square'} size={16} strokeWidth={copied ? 2.6 : 2} />
                {copied ? <Trans>Скопировано</Trans> : <Trans>Скопировать ссылку</Trans>}
              </span>
            </button>
            <UnpublishShop
              onDone={onUnpublished}
              className={cx(button, 'bg-white px-3.5 font-semibold hover:bg-lilac-hover')}
            />
          </div>
          <a
            href={whatsappShareUrl(url)}
            target="_blank"
            rel="noreferrer"
            className={cx(button, 'mt-2 bg-white font-semibold hover:bg-lilac-hover')}
          >
            <Icon name="whatsapp" size={16} />
            <Trans>Отправить ссылку в WhatsApp</Trans>
          </a>
        </>
      )}
      {status === 'draft' && (
        <div className="mt-3">
          <PublishButton
            blockers={publishBlockers(shop.readiness, me.account.emailVerified)}
            withoutPhotos={shop.readiness.productsWithoutPhoto > 0}
            onPublished={onPublished}
          />
        </div>
      )}
    </div>
  );
}
