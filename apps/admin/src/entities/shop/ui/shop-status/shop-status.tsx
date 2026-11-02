import type { ShopStatus as Status } from '@catalog/contract';
import { cx } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

const tones: Record<Status, { text: string; dot: string }> = {
  published: { text: 'text-stock-in', dot: 'bg-stock-in' },
  draft: { text: 'text-stock-low', dot: 'bg-[#e8a100]' },
  blocked: { text: 'text-coral-underside', dot: 'bg-coral-underside' },
};

/** Статус витрины точкой и словом (макеты админки): «Опубликован» / «Черновик — витрина скрыта». */
export function ShopStatus({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cx('flex items-center gap-[5px] text-[12px] font-semibold', tones[status].text, className)}>
      <span aria-hidden="true" className={cx('size-2 flex-none rounded-full', tones[status].dot)} />
      {status === 'published' && <Trans>Опубликован</Trans>}
      {status === 'draft' && <Trans>Черновик — витрина скрыта</Trans>}
      {status === 'blocked' && <Trans>Заблокирован</Trans>}
    </span>
  );
}
