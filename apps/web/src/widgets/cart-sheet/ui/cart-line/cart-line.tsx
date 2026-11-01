import { cx } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { isBlocked, MAX_ITEM_QUANTITY, type CartItem, type CartNotice } from '@/entities/cart';
import { productPath } from '@/entities/product';
import { formatPrice } from '@/shared/lib';

/** Строка корзины: миниатюра, название, вариант, цена, количество «− N +» и плашки изменений. */
export function CartLine({
  item,
  notices,
  onQuantity,
  onRemove,
  onNavigate,
}: {
  item: CartItem;
  notices: CartNotice[] | undefined;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  /** Переход на карточку товара: корзину при этом закрываем. */
  onNavigate: () => void;
}) {
  const { t } = useLingui();
  const blocked = isBlocked(notices);
  const limit = Math.min(item.maxQuantity ?? MAX_ITEM_QUANTITY, MAX_ITEM_QUANTITY);

  return (
    <li className={cx('flex items-center gap-3', blocked && 'opacity-60')}>
      <Link
        to="/$product"
        params={{ product: productPath({ slug: item.slug, shortId: item.productShortId }) }}
        onClick={onNavigate}
        aria-label={item.name}
        className="size-16 flex-none overflow-hidden rounded-thumb bg-chip-haze"
      >
        {item.photo && <img src={item.photo} alt="" className={cx('size-full object-cover', blocked && 'grayscale')} />}
      </Link>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{item.name}</p>
        {item.variantLabel && <p className="text-caption text-ink-quiet">{item.variantLabel}</p>}
        <p className="mt-0.5 text-[15px] font-extrabold tabular-nums">{formatPrice(item.price)}</p>
        <Notices notices={notices} />
        <button type="button" onClick={onRemove} className="mt-1 text-[13px] font-semibold text-ink-quiet underline">
          <Trans>Убрать</Trans>
        </button>
      </div>

      {!blocked && (
        <div className="flex flex-none items-center gap-0.5 rounded-pill bg-[#f1effa] p-[3px]">
          <button
            type="button"
            aria-label={t`Меньше`}
            disabled={item.quantity <= 1}
            onClick={() => onQuantity(item.quantity - 1)}
            className="size-[34px] rounded-full bg-white text-[17px] font-bold disabled:opacity-40"
          >
            −
          </button>
          <span aria-live="polite" className="min-w-6 text-center text-[15px] font-bold tabular-nums">
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label={t`Больше`}
            disabled={item.quantity >= limit}
            onClick={() => onQuantity(item.quantity + 1)}
            className="size-[34px] rounded-full bg-white text-[17px] font-bold disabled:opacity-40"
          >
            +
          </button>
        </div>
      )}
    </li>
  );
}

function Notices({ notices }: { notices: CartNotice[] | undefined }) {
  if (!notices || notices.length === 0) return null;
  return (
    <ul className="mt-1.5 flex flex-col items-start gap-1">
      {notices.map((notice) => (
        <li
          key={notice.kind}
          className="rounded-pill bg-[#fff1d6] px-2.5 py-0.5 text-[12px] font-semibold text-stock-low"
        >
          {notice.kind === 'price_changed' ? (
            <Trans>
              Цена изменилась: было {formatPrice(notice.from)}, стало {formatPrice(notice.to)}
            </Trans>
          ) : notice.kind === 'quantity_reduced' ? (
            <Trans>Осталось {notice.to} шт., количество уменьшено</Trans>
          ) : notice.kind === 'out_of_stock' ? (
            <Trans>Закончился</Trans>
          ) : (
            <Trans>Товар больше недоступен</Trans>
          )}
        </li>
      ))}
    </ul>
  );
}
