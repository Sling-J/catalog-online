import type { StorefrontShop } from '@catalog/contract';
import { Sheet } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import { formatPhone, instagramLink, ShopAvatar, twoGisLink, whatsappLink } from '@/entities/shop';
import { useIsDesktop } from '@/shared/hooks';
import { Icon } from '@/shared/ui';

import { CopyAddressButton } from './copy-address-button';
import { ScheduleList } from './schedule-list';

/**
 * «О магазине»: как найти, график, контакты. Телефон: шторка с логотипом, разделами и описанием.
 * Компьютер: выпадающая панель под названием слева — только адрес, график и контакты строкой (макет S8).
 */
export function AboutShopSheet({ shop, open, onClose }: { shop: StorefrontShop; open: boolean; onClose: () => void }) {
  const desktop = useIsDesktop();

  if (desktop) {
    return (
      <Sheet open={open} onClose={onClose} placement="dropdown-left" hideTitle title={shop.name}>
        {shop.address && (
          <>
            <div className="flex gap-3">
              <span className="flex size-10 flex-none items-center justify-center rounded-[14px] bg-[#f1effa] text-iris">
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
                className="flex h-[42px] flex-1 items-center justify-center rounded-[14px] bg-ink-night text-[14px] font-bold text-white"
              >
                <Trans>Открыть в 2ГИС</Trans>
              </a>
              <CopyAddressButton address={shop.address} className="h-[42px] bg-[#f1effa]" />
            </div>
          </>
        )}
        <ScheduleList schedule={shop.schedule} timezone={shop.timezone} compact />
        <div className="mt-3 flex gap-2 text-[14px]">
          <a
            href={whatsappLink(shop.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-[14px] bg-[#e6fbf2] px-3 py-2.5 text-mint-ink tabular-nums"
          >
            WhatsApp {formatPhone(shop.whatsapp)}
          </a>
          {shop.instagram && (
            <a
              href={instagramLink(shop.instagram)}
              target="_blank"
              rel="noreferrer"
              className="rounded-[14px] bg-[#f6f5fb] px-3 py-2.5"
            >
              {shop.instagram}
            </a>
          )}
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <ShopAvatar name={shop.name} logo={shop.logo} size="lg" />
          <span className="text-[20px] font-extrabold">{shop.name}</span>
        </span>
      }
    >
      {shop.address && (
        <section className="mt-1 rounded-row bg-[#f1effa] p-4">
          <div className="flex gap-3">
            <span className="flex size-10 flex-none items-center justify-center rounded-[14px] bg-white text-iris">
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
            <CopyAddressButton address={shop.address} className="h-11 bg-white" />
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
