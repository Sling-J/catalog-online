import { useId, type ReactNode } from 'react';

import { FieldLabel } from '../field-label';

/** Многострочное поле («Описание», «Как найти»): растёт по тексту, от 50 px, как поле в макетах AdminDesk (экран 2) и AdminDesk2 (экран 6). */
export function TextAreaField({
  label,
  note,
  value,
  placeholder,
  maxLength = 5000,
  onChange,
}: {
  label: ReactNode;
  note?: ReactNode;
  value: string;
  placeholder?: string;
  maxLength?: number;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id} note={note}>
        {label}
      </FieldLabel>
      <textarea
        id={id}
        value={value}
        rows={1}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="block field-sizing-content min-h-12 w-full resize-none rounded-field border-[1.5px] border-[#e2dff0] bg-white px-3.5 py-[13px] text-[15px] leading-[1.4] text-ink-night placeholder:text-ink-muted focus:border-ink-night focus:ring-[0.5px] focus:ring-ink-night focus:ring-inset focus:outline-none"
      />
    </div>
  );
}
