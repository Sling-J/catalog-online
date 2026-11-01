import { Field } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import { formatPrice } from '@/shared/lib';

import { parsePrice } from '@/features/product-filters/lib';

/** «От — до» в тенге. Значение уходит в адрес, когда поле потеряло фокус или нажат Enter. */
export function PriceRange({
  min,
  max,
  bounds,
  onChange,
}: {
  min: number | undefined;
  max: number | undefined;
  /** Самая низкая и самая высокая цена в выборке — подсказка в полях. */
  bounds: { min: number; max: number };
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

  const handlers = {
    onBlur: commit,
    onKeyDown: (event: React.KeyboardEvent) => event.key === 'Enter' && commit(),
    inputMode: 'numeric' as const,
  };

  return (
    <div className="flex gap-2">
      <Field
        className="flex-1"
        label={t`От, ₸`}
        value={from}
        onChange={(event) => setFrom(event.target.value)}
        placeholder={formatPrice(bounds.min)}
        {...handlers}
      />
      <Field
        className="flex-1"
        label={t`До, ₸`}
        value={to}
        onChange={(event) => setTo(event.target.value)}
        placeholder={formatPrice(bounds.max)}
        {...handlers}
      />
    </div>
  );
}
