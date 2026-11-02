import { cx, Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import { storefrontHost } from '@/entities/shop';
import { CopyLinkButton } from '@/features/copy-link';

/** «Ваша витрина» внизу колонки компьютера: адрес, «Открыть» в новой вкладке и копирование ссылки. */
export function StorefrontCard({ url, className }: { url: string; className?: string }) {
  return (
    <div className={cx('rounded-[20px] bg-glass p-3.5 text-[13px]', className)}>
      <div className="font-semibold text-ink-quiet">
        <Trans>Ваша витрина</Trans>
      </div>
      <div className="mt-0.5 truncate font-bold">{storefrontHost(url)}</div>
      <div className="mt-2.5 flex gap-1.5">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="press flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink-night font-semibold text-white hover:bg-ink-hover"
        >
          <Icon name="external" size={14} />
          <Trans>Открыть</Trans>
        </a>
        <CopyLinkButton url={url} />
      </div>
    </div>
  );
}
