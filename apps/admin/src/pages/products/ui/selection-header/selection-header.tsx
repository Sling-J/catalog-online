import { Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';

/** Шапка выбора на телефоне вместо заголовка «Товары» (доска AdminProductsStates, экран 1). */
export function SelectionHeader({
  count,
  onClose,
  onSelectAll,
}: {
  count: number;
  onClose: () => void;
  onSelectAll: () => void;
}) {
  const { t } = useLingui();
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClose}
        aria-label={t`Снять выбор`}
        className="flex size-11 flex-none items-center justify-center rounded-full bg-chip-haze hover:bg-haze-hover"
      >
        <Icon name="close" size={20} strokeWidth={2.4} />
      </button>
      <h1 className="flex-1 text-[22px] font-extrabold tracking-[-0.02em]">
        <Trans>Выбрано {count}</Trans>
      </h1>
      <button type="button" onClick={onSelectAll} className="text-[14px] font-bold text-iris">
        <Trans>Выбрать все</Trans>
      </button>
    </div>
  );
}
