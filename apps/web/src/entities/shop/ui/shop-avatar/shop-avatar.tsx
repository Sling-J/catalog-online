import type { Image } from '@catalog/contract';
import { cx } from '@catalog/ui';

import { getInitials } from '@/entities/shop/lib';

const sizes = { md: 'size-11 text-[15px]', lg: 'size-14 text-[19px]', xl: 'size-[72px] text-[24px]' } as const;

/** Логотип магазина или, если его нет, буквы названия на градиенте. */
export function ShopAvatar({
  name,
  logo,
  size = 'md',
  className,
}: {
  name: string;
  logo: Image | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const base = cx('flex flex-none items-center justify-center overflow-hidden rounded-full', sizes[size], className);
  if (logo) return <img src={logo.sizes[320]} alt="" className={cx(base, 'object-cover')} />;
  return (
    <span aria-hidden="true" className={cx(base, 'bg-linear-to-br from-blush to-violet font-extrabold text-white')}>
      {getInitials(name)}
    </span>
  );
}
