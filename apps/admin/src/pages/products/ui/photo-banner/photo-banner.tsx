import { Icon } from '@catalog/ui';
import { Plural, Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

/** Баннер «N товаров без фото» над списком на телефоне (макет AdminPhone, экран 2). */
export function PhotoBanner({ count }: { count: number }) {
  return (
    <div className="mt-3.5 flex items-center gap-3 rounded-[20px] bg-[#fff4d6] px-3.5 py-3">
      <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-sun">
        <Icon name="camera" size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold text-sun-ink">
          <Plural value={count} one="# товар без фото" few="# товара без фото" other="# товаров без фото" />
        </div>
        <div className="text-[13px] text-[#5a4a10]">
          <Trans>Без фото их не видно на витрине</Trans>
        </div>
      </div>
      <Link to="/products/photos" className="flex-none text-[14px] font-bold">
        <Trans>Снять →</Trans>
      </Link>
    </div>
  );
}
