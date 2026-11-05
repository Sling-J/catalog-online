import { cx } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState, type ReactNode } from 'react';

// пунктирный чип 36 px плюс рамка, как в макете (content-box; рамку 1,5 px браузер рисует в 1 px)
const CHIP =
  'inline-flex h-[38px] items-center gap-1 rounded-xl border-[1.5px] border-dashed border-[#c9c3e3] px-3 text-[14px] font-semibold text-ink-quiet';

/**
 * Чипы «+ 116» следующих размеров и «Свой размер» — поле для размера, которого нет в списке.
 * На телефоне переносятся (отступ 6 px), на компьютере — одной строкой (8 px), как в макетах.
 */
export function SizeChips({
  sizes,
  note,
  desktop,
  className,
  onAdd,
}: {
  sizes: string[];
  note?: ReactNode;
  desktop: boolean;
  className?: string;
  onAdd: (value: string) => void;
}) {
  const { t } = useLingui();
  const [custom, setCustom] = useState<string | null>(null);
  const commit = () => {
    if (custom?.trim()) onAdd(custom.trim());
    setCustom(null);
  };
  return (
    <div className={cx('flex', desktop ? 'gap-2' : 'flex-wrap gap-1.5', className)}>
      {sizes.map((size) => (
        <button key={size} type="button" onClick={() => onAdd(size)} className={cx(CHIP, 'hover:border-line-hover')}>
          + {size}
        </button>
      ))}
      {custom === null ? (
        <button
          type="button"
          onClick={() => setCustom('')}
          className="inline-flex h-9 items-center px-3 text-[14px] font-semibold text-iris"
        >
          <Trans>Свой размер</Trans>
        </button>
      ) : (
        <input
          autoFocus
          value={custom}
          maxLength={60}
          placeholder={t`Размер`}
          aria-label={t`Свой размер`}
          onChange={(event) => setCustom(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            }
            if (event.key === 'Escape') setCustom(null);
          }}
          className={cx(CHIP, 'w-28 text-ink-night outline-none placeholder:text-ink-muted focus:border-ink-night')}
        />
      )}
      {note}
    </div>
  );
}
