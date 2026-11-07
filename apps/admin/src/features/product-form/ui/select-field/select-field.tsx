import { cx, Icon } from '@catalog/ui';
import { useId, type ReactNode } from 'react';

import { FieldLabel } from '@/shared/ui';

export type SelectOption = { value: string; label: string };

/**
 * Список в виде поля ввода (рамка 1,5 px, 50 px): «Категория». С `chevron` стрелка стоит сразу за текстом
 * (макеты нового товара), без неё — поле как текстовое (макеты редактирования).
 */
export function SelectField({
  label,
  note,
  value,
  options,
  chevron,
  onChange,
  className,
}: {
  label: ReactNode;
  note?: ReactNode;
  value: string;
  options: SelectOption[];
  chevron?: boolean;
  onChange: (value: string) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <FieldLabel htmlFor={id} note={note}>
        {label}
      </FieldLabel>
      <div className="flex min-h-12 items-center gap-1 rounded-field border-[1.5px] border-[#e2dff0] bg-white px-3.5 py-[13px] text-[15px] leading-[1.4] focus-within:border-ink-night focus-within:ring-[0.5px] focus-within:ring-ink-night focus-within:ring-inset">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cx(
            'min-w-0 cursor-pointer appearance-none bg-transparent outline-none',
            chevron ? 'field-sizing-content' : 'flex-1',
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {chevron && (
          <Icon
            name="chevron-down"
            size={14}
            strokeWidth={2.4}
            className="pointer-events-none flex-none text-ink-quiet"
          />
        )}
      </div>
    </div>
  );
}
