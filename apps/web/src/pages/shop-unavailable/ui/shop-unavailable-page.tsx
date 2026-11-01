import type { StorefrontShopGone } from '@catalog/contract';
import { Trans, useLingui } from '@lingui/react/macro';

import { groupSchedule, ShopAvatar, useWeekdayLabels } from '@/entities/shop';
import { AskInWhatsApp } from '@/features/ask-in-whatsapp';
import { ClayBlock } from '@/shared/ui';

/**
 * Каталог скрыт или магазин заблокирован (API отвечает 410): вместо витрины — логотип, «Каталог сейчас обновляется»,
 * WhatsApp, адрес и график. Контакты приходят в теле ответа. Телефон: всё по центру в столбик;
 * компьютер: текст и контакты слева, предмет справа.
 */
export function ShopUnavailablePage({ shop }: { shop: StorefrontShopGone['shop'] }) {
  const { t } = useLingui();
  const weekdays = useWeekdayLabels();

  const schedule = groupSchedule(shop.schedule).map((group) => {
    const first = group.days[0]!;
    const last = group.days.at(-1)!;
    const days = group.days.length > 1 ? `${weekdays.short[first]}–${weekdays.short[last]}` : weekdays.short[first];
    return `${days} ${group.hours ? `${group.hours.open}–${group.hours.close}` : t`выходной`}`;
  });

  return (
    <main className="min-h-dvh bg-paper pb-10 font-sans text-ink-night">
      <div className="mx-auto flex max-w-[1040px] flex-col px-7 pt-[70px] text-center lg:flex-row lg:items-center lg:gap-14 lg:px-10 lg:pt-[150px] lg:text-left">
        <div className="lg:flex-1">
          <div className="flex flex-col items-center lg:flex-row lg:gap-3.5">
            <ShopAvatar name={shop.name} logo={shop.logo} size="xl" className="lg:size-16 lg:text-[22px]" />
            <p className="mt-3 text-[20px] font-extrabold lg:mt-0 lg:text-[22px]">{shop.name}</p>
          </div>

          <div className="mt-[30px] lg:hidden">
            <ClayBlock tone="mint" rotate={6} label={t`скоро`} />
          </div>

          <h1 className="mt-6 text-[21px] leading-[1.25] font-extrabold tracking-[-0.01em] lg:mt-[34px] lg:text-[40px] lg:leading-[1.1] lg:tracking-[-0.03em]">
            <Trans>Каталог сейчас обновляется</Trans>
          </h1>
          <p className="mx-auto mt-2 max-w-[320px] text-[15px] leading-normal text-ink-soft lg:mx-0 lg:mt-3.5 lg:max-w-[460px] lg:text-[17px] lg:leading-[1.55]">
            <Trans>Магазин временно скрыл товары. Напишите в WhatsApp — подскажут, что есть в наличии.</Trans>
          </p>
          <div className="mt-5 flex justify-center lg:mt-[26px] lg:justify-start">
            <AskInWhatsApp
              phone={shop.whatsapp}
              message={t`Здравствуйте! Каталог на сайте сейчас недоступен — подскажите, что есть в наличии?`}
            >
              <Trans>Написать в WhatsApp</Trans>
            </AskInWhatsApp>
          </div>
          {(shop.address || schedule.length > 0) && (
            <div className="mx-auto mt-7 max-w-[320px] rounded-row bg-[#f1effa] p-4 text-left text-[14px] leading-normal text-ink-soft lg:mx-0 lg:mt-[30px] lg:max-w-[460px] lg:px-5 lg:py-[18px] lg:text-[15px] lg:leading-[1.55]">
              {shop.address && <p className="font-bold text-ink-night">{shop.address}</p>}
              <p>{schedule.join(' · ')}</p>
            </div>
          )}
        </div>

        <div className="hidden w-[320px] flex-none lg:block">
          <ClayBlock tone="mint" rotate={8} label={t`скоро`} size="xl" />
        </div>
      </div>
    </main>
  );
}
