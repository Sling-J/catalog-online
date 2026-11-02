import { cx, formatAmount } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import { parsePrice } from '@/features/product-filters/lib';

/**
 * «От — до» в тенге: два поля без подписей, в подсказке — крайние цены выборки («от 3 500», «до 24 900»).
 * Значение уходит в адрес, когда поле потеряло фокус или нажат Enter.
 */
export function PriceRange({
  min,
  max,
  bounds,
  compact,
  onChange,
}: {
  min: number | undefined;
  max: number | undefined;
  /** Самая низкая и самая высокая цена в выборке — подсказка в полях. */
  bounds: { min: number; max: number };
  /** Поля 40 px — в панели фильтров на компьютере; в шторке 48 px. */
  compact?: boolean;
  onChange: (range: { priceMin?: number; priceMax?: number }) => void;
}) {
  const { t } = useLingui();
  const [from, setFrom] = useState(min?.toString() ?? '');
  const [to, setTo] = useState(max?.toString() ?? '');

  // сброс и снятие чипа меняют адрес снаружи — поля подхватывают
  useEffect(() => setFrom(min?.toString() ?? ''), [min]);
  useEffect(() => setTo(max?.toString() ?? ''), [max]);

  const commit = () => {
    const priceMin = parsePrice(from);
    const priceMax = parsePrice(to);
    if (priceMin !== min || priceMax !== max) onChange({ priceMin, priceMax });
  };

  const input = (value: string, set: (value: string) => void, placeholder: string, label: string) => (
    <input
      value={value}
      onChange={(event) => set(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => event.key === 'Enter' && commit()}
      inputMode="numeric"
      placeholder={placeholder}
      aria-label={label}
      className={cx(
        'min-w-0 flex-1 rounded-field bg-[#f1effa] px-3.5 text-ink-night tabular-nums outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-ink-night',
        compact ? 'h-10 text-[14px]' : 'h-12 text-[15px]',
      )}
    />
  );

  return (
    <div className="flex gap-2">
      {input(from, setFrom, t`от ${formatAmount(bounds.min)}`, t`Цена от, ₸`)}
      {input(to, setTo, t`до ${formatAmount(bounds.max)}`, t`Цена до, ₸`)}
    </div>
  );
}
