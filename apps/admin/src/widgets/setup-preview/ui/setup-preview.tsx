import type { Image } from '@catalog/contract';
import { cx } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';

import { ShopAvatar } from '@/entities/shop';

import { PREVIEW_PHOTOS } from '../constants';

/**
 * Живое превью в мастере на компьютере (A12, макет AdminDesk2, шаги 1–4): телефон с витриной на сиреневом.
 * Шапка живая — название и логотип; поиск, чипы и сетка товаров — неизменный пример с фото из макета.
 * Логотипа нет — до шага 4 пустой кружок, на шаге 4 буквы названия.
 */
export function SetupPreview({ name, logo, initials }: { name: string; logo: Image | null; initials: boolean }) {
  const { t } = useLingui();
  return (
    <aside
      aria-label={t`Так увидят покупатели`}
      className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-lilac-field lg:flex"
    >
      <div
        aria-hidden="true"
        className="absolute -top-[60px] -left-20 size-[360px] rounded-full bg-[radial-gradient(circle,rgb(255_255_255/0.7),rgb(255_255_255/0)_68%)]"
      />
      <div className="relative mb-[18px] rounded-pill bg-white/60 px-3.5 py-2 text-[14px] font-bold">
        <Trans>Так увидят покупатели</Trans>
      </div>
      <div className="relative h-[660px] w-80 rounded-[44px] border border-white/90 bg-white/60 p-2.5 shadow-[0_40px_90px_rgb(40_20_110/0.28)]">
        <div className="size-full overflow-hidden rounded-[34px] bg-paper">
          <div className="border-b border-[#eceaf5] px-3 pt-3.5 pb-2.5">
            <div className="flex items-center gap-2">
              {logo || initials ? (
                <ShopAvatar name={name} logo={logo} size="xs" />
              ) : (
                <span className="box-content size-9 flex-none rounded-full border-[1.5px] border-dashed border-[#c9c3e3]" />
              )}
              <div className="min-w-0">
                <div className="truncate text-[14px] font-extrabold">{name}</div>
                <div className="text-[10px] text-ink-quiet">
                  <Trans>адрес и график добавите потом</Trans>
                </div>
              </div>
            </div>
            <div className="mt-2.5 h-[34px] rounded-xl bg-chip-haze" />
            <div className="mt-2.5 flex gap-1.5">
              {[t`Все`, t`Куртки`, t`Платья`, t`Обувь`].map((chip, index) => (
                <span
                  key={chip}
                  className={cx(
                    'inline-flex h-7 items-center rounded-pill px-2.5 text-[11px] font-semibold',
                    index === 0 ? 'bg-ink-night text-white' : 'bg-chip-haze',
                  )}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-0.5">
            {PREVIEW_PHOTOS.map((src) => (
              <img key={src} src={src} alt="" className="block aspect-square w-full object-cover" />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
