import type { Attribute } from '@catalog/contract';
import { Icon, Select } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';

/** Свойство таблицы размеров — серая пилюля «Рост ⌄»; на компьютере перед ней подпись «Свойство». */
export function AttributePicker({
  attributes,
  value,
  caption,
  onChange,
}: {
  attributes: Attribute[];
  value: string | null;
  caption: boolean;
  onChange: (attributeId: string | null) => void;
}) {
  const { t } = useLingui();
  const options = [
    ...attributes.map((attribute) => ({ value: attribute.id, label: attribute.name })),
    { value: '', label: t`Без размеров` },
  ];
  const current = options.find((option) => option.value === (value ?? ''));
  const pill = (
    <Select
      label={t`Свойство размеров`}
      value={value ?? ''}
      options={options}
      onChange={(next) => onChange(next || null)}
      className="press inline-flex h-8 items-center gap-1 rounded-pill bg-chip-haze px-3 text-[13px] font-semibold text-ink-night hover:bg-haze-hover"
    >
      {current?.label}
      <Icon name="chevron-down" size={13} strokeWidth={2.4} className="text-ink-quiet" />
    </Select>
  );
  if (!caption) return pill;
  return (
    <span className="flex items-center gap-2.5 text-[13px] text-ink-quiet">
      <Trans>Свойство</Trans> {pill}
    </span>
  );
}
