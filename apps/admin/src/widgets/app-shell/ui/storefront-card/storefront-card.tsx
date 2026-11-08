import { cx, Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import { storefrontHost, StorefrontLink } from '@/entities/shop';

/**
 * «Ваша витрина» внизу колонки компьютера — только адрес и переход (UX-аудит, D2): публикация и «Скопировать» живут
 * в одном месте — «Магазин». До публикации ссылка открывает превью (E2).
 */
export function StorefrontCard({ url, className }: { url: string; className?: string }) {
  return (
    <StorefrontLink
      className={cx('press block rounded-[20px] bg-glass p-3.5 text-[13px] hover:bg-white/70', className)}
    >
      <span className="block font-semibold text-ink-quiet">
        <Trans>Ваша витрина</Trans>
      </span>
      <span className="mt-0.5 flex items-center gap-1.5 font-bold">
        <span className="min-w-0 truncate">{storefrontHost(url)}</span>
        <Icon name="external" size={14} className="flex-none" />
      </span>
    </StorefrontLink>
  );
}
