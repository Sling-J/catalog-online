import { cx, Icon, Select, type SelectAction, type SelectOption } from '@catalog/ui';
import { useId, type ReactNode } from 'react';

import { FieldLabel } from '@/shared/ui';

export type { SelectOption };

/**
 * Список в виде поля ввода (рамка 1,5 px, 50 px): «Категория». С `chevron` стрелка стоит сразу за текстом
 * (макеты нового товара), без неё — поле как текстовое (макеты редактирования). Список — свой (`Select`):
 * панель под полем на компьютере, шторка на телефоне; в конце — действия (`actions`).
 */
export function SelectField({
  label,
  title,
  note,
  value,
  options,
  actions,
  chevron,
  onChange,
  className,
}: {
  label: ReactNode;
  /** Заголовок шторки на телефоне и имя списка для дикторов. */
  title: string;
  note?: ReactNode;
  value: string;
  options: SelectOption[];
  actions?: SelectAction[];
  chevron?: boolean;
  onChange: (value: string) => void;
  className?: string;
}) {
  const id = useId();
  const current = options.find((option) => option.value === value);
  return (
    <div className={className}>
      <FieldLabel htmlFor={id} note={note}>
        {label}
      </FieldLabel>
      <Select
        id={id}
        label={title}
        value={value}
        options={options}
        actions={actions}
        onChange={onChange}
        className={cx(
          'flex min-h-12 w-full items-center gap-1 rounded-field border-[1.5px] border-[#e2dff0] bg-white px-3.5 py-[13px] text-left text-[15px] leading-[1.4] outline-none',
          'focus-visible:border-ink-night focus-visible:ring-[0.5px] focus-visible:ring-ink-night focus-visible:ring-inset aria-expanded:border-ink-night',
        )}
      >
        <span className={cx('min-w-0 truncate', !chevron && 'flex-1')}>{current?.label}</span>
        <Icon
          name="chevron-down"
          size={14}
          strokeWidth={2.4}
          className={cx('flex-none text-ink-quiet', !chevron && 'hidden')}
        />
      </Select>
    </div>
  );
}
