import type { Attribute } from '@catalog/contract';
import { Icon } from '@catalog/ui';
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
  const pill = (
    <span className="relative inline-flex h-8 items-center gap-1 rounded-pill bg-chip-haze px-3 text-[13px] font-semibold text-ink-night focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-iris">
      <select
        value={value ?? ''}
        aria-label={t`Свойство размеров`}
        onChange={(event) => onChange(event.target.value || null)}
        className="field-sizing-content cursor-pointer appearance-none bg-transparent outline-none"
      >
        {attributes.map((attribute) => (
          <option key={attribute.id} value={attribute.id}>
            {attribute.name}
          </option>
        ))}
        <option value="">{t`Без размеров`}</option>
      </select>
      <Icon name="chevron-down" size={13} strokeWidth={2.4} className="pointer-events-none text-ink-quiet" />
    </span>
  );
  if (!caption) return pill;
  return (
    <span className="flex items-center gap-2.5 text-[13px] text-ink-quiet">
      <Trans>Свойство</Trans> {pill}
    </span>
  );
}
