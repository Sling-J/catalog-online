import { cx } from '@catalog/ui';
import { useId, type ReactNode } from 'react';

import { AmountInput } from '../amount-input';
import { FieldLabel } from '@/shared/ui';

/** «Цена, ₸» нового товара — одна на все размеры (макеты AdminPhone2, экран 7, и AdminDesk2, экран 6). */
export function PriceField({
  label,
  note,
  value,
  error,
  className,
  onChange,
}: {
  label: ReactNode;
  note?: ReactNode;
  value: string;
  error?: string;
  className?: string;
  onChange: (digits: string) => void;
}) {
  const id = useId();
  return (
    <div className={className}>
      <FieldLabel htmlFor={id} note={note}>
        {label}
      </FieldLabel>
      <AmountInput
        id={id}
        value={value}
        suffix={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onValueChange={onChange}
        className={cx(
          'w-full rounded-field border-[1.5px] bg-white px-3.5 py-[13px] text-[15px] leading-[1.4] text-ink-night',
          'focus:border-ink-night focus:ring-[0.5px] focus:ring-ink-night focus:ring-inset focus:outline-none',
          error ? 'border-coral-underside' : 'border-[#e2dff0]',
        )}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] text-coral-underside">
          {error}
        </p>
      )}
    </div>
  );
}
