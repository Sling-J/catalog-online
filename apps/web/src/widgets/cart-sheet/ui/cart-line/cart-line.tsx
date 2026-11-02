import { cx, Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { isBlocked, MAX_ITEM_QUANTITY, type CartItem, type CartNotice } from '@/entities/cart';
import { productPath } from '@/entities/product';
import { formatPrice } from '@/shared/lib';

/**
 * Строка корзины: миниатюра, название, вариант, сумма, справа количество «− N +» (на единице вместо «−» значок
 * корзины — убрать позицию), под строкой плашки изменений. На компьютере (`compact`) всё чуть мельче
 * (макет «Витрина — корзина», 2026-11-02).
 */
export function CartLine({
  item,
  notices,
  compact,
  onQuantity,
  onRemove,
  onNavigate,
}: {
  item: CartItem;
  notices: CartNotice[] | undefined;
  compact?: boolean;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  /** Переход на карточку товара: корзину при этом закрываем. */
  onNavigate: () => void;
}) {
  const { t } = useLingui();
  const blocked = isBlocked(notices);
  const limit = Math.min(item.maxQuantity ?? MAX_ITEM_QUANTITY, MAX_ITEM_QUANTITY);
  const sum = formatPrice(item.price * item.quantity);
  const stepper = compact ? 'size-[30px] text-[16px]' : 'size-[34px] text-[17px]';

  return (
    <li className="flex flex-col gap-2">
      <div className={cx('flex items-center gap-3', blocked && 'opacity-55')}>
        <Link
          to="/$product"
          params={{ product: productPath({ slug: item.slug, shortId: item.productShortId }) }}
          onClick={onNavigate}
          aria-label={item.name}
          className={cx(
            'flex-none overflow-hidden bg-chip-haze',
            compact ? 'size-14 rounded-[14px]' : 'size-16 rounded-field',
          )}
        >
          {item.photo && (
            <img src={item.photo} alt="" className={cx('size-full object-cover', blocked && 'grayscale')} />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <p className={cx('truncate font-semibold', compact ? 'text-[14px]' : 'text-[15px]')}>{item.name}</p>
          <p className="text-[13px] text-ink-quiet">{item.variantLabel}</p>
          <p className={cx('mt-px font-extrabold tabular-nums', compact ? 'text-[14px]' : 'mt-0.5 text-[15px]')}>
            {sum}
          </p>
        </div>

        {!blocked && (
          <div className="flex flex-none items-center gap-0.5 rounded-pill bg-[#f1effa] p-[3px]">
            {/* на единице «−» становится корзиной: видно, что нажатие уберёт товар */}
            <button
              type="button"
              aria-label={item.quantity > 1 ? t`Меньше` : t`Убрать из корзины`}
              onClick={() => (item.quantity > 1 ? onQuantity(item.quantity - 1) : onRemove())}
              className={cx(
                'flex items-center justify-center rounded-full bg-white font-bold hover:bg-chip-haze',
                stepper,
              )}
            >
              {item.quantity > 1 ? '−' : <Icon name="trash" size={compact ? 15 : 17} />}
            </button>
            <span
              aria-live="polite"
              className={cx('min-w-[22px] text-center font-bold tabular-nums', compact ? 'text-[14px]' : 'text-[15px]')}
            >
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label={t`Больше`}
              disabled={item.quantity >= limit}
              onClick={() => onQuantity(item.quantity + 1)}
              className={cx('rounded-full bg-white font-bold hover:bg-chip-haze disabled:opacity-40', stepper)}
            >
              +
            </button>
          </div>
        )}
      </div>
      <Notices item={item} notices={notices} compact={compact} onRemove={onRemove} />
    </li>
  );
}

const tones = {
  good: 'bg-[#e6fbf2] text-mint-ink',
  warn: 'bg-[#fff1d6] text-[#7a4300]',
  gone: 'bg-[#f1effa] text-ink-quiet',
};

/** Плашки под строкой: цена снизилась (мятная), выросла или уменьшено количество (жёлтая), закончился (серая). */
function Notices({
  item,
  notices,
  compact,
  onRemove,
}: {
  item: CartItem;
  notices: CartNotice[] | undefined;
  compact?: boolean;
  onRemove: () => void;
}) {
  if (!notices || notices.length === 0) return null;
  const remove = (
    <button type="button" onClick={onRemove} className="underline hover:text-ink-night">
      <Trans>Убрать</Trans>
    </button>
  );
  return (
    <ul className={cx('flex flex-col gap-2', compact ? 'ml-[68px]' : 'ml-[76px]')}>
      {notices.map((notice) => {
        const tone =
          notice.kind === 'price_changed'
            ? notice.to < notice.from
              ? tones.good
              : tones.warn
            : notice.kind === 'quantity_reduced'
              ? tones.warn
              : tones.gone;
        return (
          <li
            key={notice.kind}
            className={cx('rounded-xl px-3 py-2 text-[13px] leading-[1.4] font-semibold tabular-nums', tone)}
          >
            {notice.kind === 'price_changed' ? (
              notice.to < notice.from ? (
                <Trans>Цена снизилась: было {formatPrice(notice.from)}</Trans>
              ) : (
                <Trans>Цена выросла: было {formatPrice(notice.from)}</Trans>
              )
            ) : notice.kind === 'quantity_reduced' ? (
              <Trans>Осталось {notice.to} шт. — количество уменьшили</Trans>
            ) : notice.kind === 'out_of_stock' ? (
              <>
                {item.variantLabel ? <Trans>{item.variantLabel} закончился</Trans> : <Trans>Закончился</Trans>}
                {' · '}
                {remove}
              </>
            ) : (
              <>
                <Trans>Товар больше недоступен</Trans>
                {' · '}
                {remove}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
