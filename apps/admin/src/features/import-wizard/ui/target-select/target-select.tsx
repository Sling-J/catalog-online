import type { ColumnMapping } from '@catalog/contract';
import { cx, Icon } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';

import { useTargetLabels } from '../../hooks';
import { FIELD_TARGETS, mappingFromValue, mappingValue } from '../../lib';

/**
 * «Куда загрузить» колонку: поле, свойство или «Не загружать». Пилюля 40 px с подписью и стрелкой, поверх —
 * прозрачный системный список (на телефоне откроется родной выбор). Свойство — сиреневое, «Не загружать» —
 * серое с пунктиром (макет AdminDesk, экран 3). Свойства — существующие в магазине и новое с именем колонки.
 */
export function TargetSelect({
  item,
  attributes,
  onChange,
  className,
}: {
  item: ColumnMapping;
  attributes: string[];
  onChange: (item: ColumnMapping) => void;
  className?: string;
}) {
  const { t } = useLingui();
  const labels = useTargetLabels();
  const value = mappingValue(item);
  // новое свойство — с именем колонки или то, что уже выбрано (запомненное сопоставление)
  const known = new Set(attributes.map((name) => name.toLowerCase()));
  const extra = [item.column, item.target === 'attribute' ? item.attributeName : null].filter(
    (name, index, list): name is string => !!name && !known.has(name.toLowerCase()) && list.indexOf(name) === index,
  );
  const attributeName = item.attributeName ?? item.column;
  const label =
    item.target === 'attribute'
      ? t`Атрибут «${attributeName}»`
      : item.target === 'skip'
        ? t`Не загружать`
        : labels[item.target];
  const column = item.column;
  return (
    <span
      className={cx(
        'relative inline-flex h-10 min-w-0 items-center justify-between gap-2 rounded-[12px] border-[1.5px] px-3 text-[14px] font-semibold',
        'focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-iris',
        item.target === 'attribute'
          ? 'border-[#cfc8ff] bg-[#ece9ff] text-[#2a2290]'
          : item.target === 'skip'
            ? 'border-dashed border-[#d6d2e8] bg-[#f6f5fb] text-ink-muted'
            : 'border-[#e2dff0] bg-white',
        className,
      )}
    >
      <span className="truncate">{label}</span>
      <Icon name="chevron-down" size={15} strokeWidth={2.4} className="flex-none text-ink-quiet" />
      <select
        value={value}
        aria-label={t`Куда загрузить колонку «${column}»`}
        onChange={(event) => onChange(mappingFromValue(item.column, event.target.value))}
        className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
      >
        <optgroup label={t`Поля товара`}>
          {FIELD_TARGETS.map((target) => (
            <option key={target} value={target}>
              {labels[target]}
            </option>
          ))}
        </optgroup>
        <optgroup label={t`Атрибуты — по ним фильтруют на витрине`}>
          {attributes.map((name) => (
            <option key={name} value={`attribute:${name}`}>
              {t`Атрибут «${name}»`}
            </option>
          ))}
          {extra.map((name) => (
            <option key={name} value={`attribute:${name}`}>
              {t`Новый атрибут «${name}»`}
            </option>
          ))}
        </optgroup>
        <option value="skip">{t`Не загружать`}</option>
      </select>
    </span>
  );
}
