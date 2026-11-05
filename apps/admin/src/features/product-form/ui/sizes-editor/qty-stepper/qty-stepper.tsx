import { cx } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';

/** Количество «− N +» в строке размера (макеты нового товара); меньше нуля не бывает. */
export function QtyStepper({
  value,
  label,
  desktop,
  onChange,
}: {
  value: number;
  label?: string;
  desktop: boolean;
  onChange: (value: number) => void;
}) {
  const { t } = useLingui();
  const of = label ? `: ${label}` : '';
  return (
    <span
      className={cx(
        'flex h-[42px] items-center justify-between rounded-xl border-[1.5px] border-[#e2dff0] font-semibold tabular-nums',
        desktop ? 'px-3' : 'bg-white px-2 text-[15px]',
      )}
    >
      <button
        type="button"
        aria-label={t`Меньше${of}`}
        disabled={value === 0}
        onClick={() => onChange(value - 1)}
        className="text-ink-muted hover:text-ink-night disabled:opacity-40"
      >
        −
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        aria-label={t`Больше${of}`}
        onClick={() => onChange(value + 1)}
        className="text-ink-muted hover:text-ink-night"
      >
        +
      </button>
    </span>
  );
}
