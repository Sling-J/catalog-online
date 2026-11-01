import type { StorefrontShop } from '@catalog/contract';
import { Sheet } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import { formatPhone, instagramLink, ShopAvatar, twoGisLink, whatsappLink } from '@/entities/shop';
import { Icon } from '@/shared/ui';

import { useSheetPlacement } from '@/shared/hooks';
import { CopyAddressButton } from './copy-address-button';
import { ScheduleList } from './schedule-list';

/** «О магазине»: как найти, график, контакты. Шторка на телефоне, окно на компьютере. */
export function AboutShopSheet({ shop, open, onClose }: { shop: StorefrontShop; open: boolean; onClose: () => void }) {
  // на компьютере — панель под названием магазина слева (S8)
  const placement = useSheetPlacement('dropdown-left');

  return (
    <Sheet
      open={open}
      onClose={onClose}
      placement={placement}
      title={
        <span className="flex items-center gap-3">
          <ShopAvatar name={shop.name} logo={shop.logo} size="lg" />
          <span className="text-[20px] font-extrabold">{shop.name}</span>
        </span>
      }
    >
      {shop.address && (
        <section className="rounded-row bg-[#f1effa] p-4">
          <div className="flex gap-3">
            <span className="flex size-10 flex-none items-center justify-center rounded-[14px] bg-white text-[#3b2fd9]">
              <Icon name="pin" />
            </span>
            <div>
              <div className="text-[15px] font-bold">{shop.address}</div>
              {shop.howToFind && <p className="mt-0.5 text-[14px] leading-normal text-ink-soft">{shop.howToFind}</p>}
            </div>
          </div>
          <div className="mt-3.5 flex gap-2">
            <a
              href={twoGisLink(shop.address)}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 flex-1 items-center justify-center rounded-[14px] bg-ink-night text-[14px] font-bold text-white"
            >
              <Trans>Открыть в 2ГИС</Trans>
            </a>
            <CopyAddressButton address={shop.address} />
          </div>
        </section>
      )}

      <h3 className="mt-[18px] text-[15px] font-bold">
        <Trans>График работы</Trans>
      </h3>
      <ScheduleList schedule={shop.schedule} timezone={shop.timezone} />

      <h3 className="mt-3.5 text-[15px] font-bold">
        <Trans>Связаться</Trans>
      </h3>
      <div className="mt-2 flex flex-col gap-2">
        <a
          href={whatsappLink(shop.whatsapp)}
          target="_blank"
          rel="noreferrer"
          className="flex h-[52px] items-center justify-between rounded-field bg-[#e6fbf2] px-4 text-mint-ink"
        >
          <span className="text-[15px] font-semibold">WhatsApp</span>
          <span className="text-[14px] tabular-nums">{formatPhone(shop.whatsapp)}</span>
        </a>
        {shop.instagram && (
          <a
            href={instagramLink(shop.instagram)}
            target="_blank"
            rel="noreferrer"
            className="flex h-[52px] items-center justify-between rounded-field bg-[#f6f5fb] px-4"
          >
            <span className="text-[15px] font-semibold">Instagram</span>
            <span className="text-[14px] text-ink-quiet">{shop.instagram}</span>
          </a>
        )}
      </div>

      {shop.description && <p className="mt-4 text-[14px] leading-[1.55] text-ink-soft">{shop.description}</p>}
    </Sheet>
  );
}
