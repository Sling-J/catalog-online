import { cx, Icon } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';

import { useCopied } from '@/shared/hooks';

/**
 * «Скопировать ссылку»; после копирования на две секунды показывает галочку. Обычно — белый квадрат 36 px
 * («Ваша витрина»), `bare` — одна иконка 20 px (карточка «Адрес витрины» на главной).
 */
export function CopyLinkButton({ url, bare, className }: { url: string; bare?: boolean; className?: string }) {
  const { t } = useLingui();
  const { copied, copy } = useCopied();

  return (
    <button
      type="button"
      onClick={() => copy(url)}
      aria-label={copied ? t`Ссылка скопирована` : t`Скопировать ссылку`}
      className={cx(
        'flex flex-none items-center justify-center',
        !bare && 'size-9 rounded-xl bg-white hover:bg-lilac-hover',
        className,
      )}
    >
      <Icon name={copied ? 'check' : 'copy-square'} size={bare ? 20 : 16} strokeWidth={copied ? 2.6 : 2} />
    </button>
  );
}
