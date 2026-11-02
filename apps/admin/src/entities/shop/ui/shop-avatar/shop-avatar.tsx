import type { Image } from '@catalog/contract';
import { cx } from '@catalog/ui';

import { getInitials } from '@/entities/shop/lib';

const sizes = { sm: 'size-9 text-[13px]', md: 'size-10 text-[14px]' } as const;

/** Логотип магазина или, если его нет, буквы названия на градиенте — как на витрине. */
export function ShopAvatar({
  name,
  logo,
  size = 'md',
  className,
}: {
  name: string;
  logo: Image | null | undefined;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const base = cx('flex flex-none items-center justify-center overflow-hidden rounded-full', sizes[size], className);
  if (logo) return <img src={logo.sizes[320]} alt="" className={cx(base, 'object-cover')} />;
  return (
    <span
      aria-hidden="true"
      className={cx(
        base,
        'bg-[linear-gradient(140deg,var(--color-blush),var(--color-violet))] font-extrabold text-white',
      )}
    >
      {getInitials(name)}
    </span>
  );
}
