import { Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';

/** «Назад» мастера: на телефоне квадрат 52 px со стрелкой, на компьютере — стрелка и слово. */
export function BackButton({ onClick, variant }: { onClick: () => void; variant: 'phone' | 'desk' }) {
  const { t } = useLingui();
  if (variant === 'phone') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={t`Назад`}
        className="flex size-[52px] flex-none items-center justify-center rounded-pill bg-chip-haze hover:bg-haze-hover"
      >
        <Icon name="chevron-left" size={18} strokeWidth={2.4} />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-[52px] items-center justify-center gap-2 rounded-pill bg-chip-haze px-[22px] text-[15px] font-bold hover:bg-haze-hover"
    >
      <Icon name="chevron-left" size={18} strokeWidth={2.4} />
      <Trans>Назад</Trans>
    </button>
  );
}
