import type { ShopStatus as Status } from '@catalog/contract';
import { cx } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

const tones: Record<Status, { text: string; dot: string }> = {
  published: { text: 'text-stock-in', dot: 'bg-stock-in' },
  draft: { text: 'text-stock-low', dot: 'bg-[#e8a100]' },
  blocked: { text: 'text-coral-underside', dot: 'bg-coral-underside' },
};

/**
 * Статус витрины точкой и словом (макеты админки): «Опубликован» / «Черновик — витрина скрыта».
 * `stacked` — узкая карточка в колонке компьютера (макет AdminSideDraft): «Черновик», с новой строки «Витрина скрыта»,
 * точка у первой строки.
 */
export function ShopStatus({ status, stacked, className }: { status: Status; stacked?: boolean; className?: string }) {
  const twoLines = stacked && status === 'draft';
  return (
    <span
      className={cx(
        'flex gap-[5px] text-[12px] font-semibold',
        twoLines ? 'items-start' : 'items-center',
        tones[status].text,
        className,
      )}
    >
      <span aria-hidden="true" className={cx('size-2 flex-none rounded-full', twoLines && 'mt-1', tones[status].dot)} />
      {status === 'published' && <Trans>Опубликован</Trans>}
      {status === 'draft' &&
        (twoLines ? (
          <span>
            <Trans>Черновик</Trans>
            <br />
            <Trans>Витрина скрыта</Trans>
          </span>
        ) : (
          <Trans>Черновик — витрина скрыта</Trans>
        ))}
      {status === 'blocked' && <Trans>Заблокирован</Trans>}
    </span>
  );
}
