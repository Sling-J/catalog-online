import type { Image } from '@catalog/contract';
import { cx } from '@catalog/ui';

import { getInitials } from '@/entities/shop/lib';

// размеры из макетов: превью витрины 36, шапка 36/40, превью ссылки 52 (квадрат), «О магазине» 64, мастер 96/104
const sizes = {
  xs: 'size-9 text-[12px]',
  sm: 'size-9 text-[13px]',
  md: 'size-10 text-[14px]',
  link: 'size-[52px] text-[18px]',
  info: 'size-16 text-[22px]',
  lg: 'size-24 text-[32px]',
  xl: 'size-[104px] text-[34px]',
} as const;

/** Логотип магазина или, если его нет, буквы названия на градиенте — как на витрине. */
export function ShopAvatar({
  name,
  logo,
  size = 'md',
  square,
  className,
}: {
  name: string;
  logo: Image | null | undefined;
  size?: keyof typeof sizes;
  /** Квадрат со скруглением 10 px — картинка в превью ссылки. */
  square?: boolean;
  className?: string;
}) {
  const base = cx(
    'flex flex-none items-center justify-center overflow-hidden',
    square ? 'rounded-[10px]' : 'rounded-full',
    sizes[size],
    className,
  );
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
