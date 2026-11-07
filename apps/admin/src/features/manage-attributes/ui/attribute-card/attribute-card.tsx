import type { Attribute } from '@catalog/contract';
import { cx, Switch } from '@catalog/ui';
import { Plural, Trans, useLingui } from '@lingui/react/macro';

import { valuesRange } from '@/entities/attribute';

import { ValueChips } from '../value-chips';

type Value = Attribute['values'][number];

/**
 * Карточка свойства (макет AdminPhone2, «Категории и размеры»). Раскрытая — название, «в фильтрах», значения
 * чипами и подсказка; свёрнутая — название, «24–31 · 8 значений» и «в фильтрах». Раскрыта одна; нажатие на
 * свёрнутую раскрывает её, на название раскрытой — шторка свойства (переименовать, удалить).
 */
export function AttributeCard({
  attribute,
  expanded,
  first,
  onExpand,
  onEdit,
  onInFilters,
  onReorderValues,
  onOpenValue,
  onAddValue,
}: {
  attribute: Attribute;
  expanded: boolean;
  first: boolean;
  onExpand: () => void;
  onEdit: () => void;
  onInFilters: (inFilters: boolean) => void;
  onReorderValues: (ids: string[]) => void;
  onOpenValue: (value: Value) => void;
  onAddValue: (value: string) => Promise<unknown>;
}) {
  const { t } = useLingui();
  const name = attribute.name;
  const count = attribute.values.length;
  const range = valuesRange(attribute.values);
  // у Switch ширина на всю строку: обёртка по содержимому оставляет место названию
  const filters = (
    <span className="flex-none">
      <Switch
        checked={attribute.inFilters}
        onCheckedChange={onInFilters}
        aria-label={t`«${name}» в фильтрах витрины`}
        label={<span className="text-[13px] font-normal text-ink-quiet">{t`в фильтрах`}</span>}
        className="gap-2!"
      />
    </span>
  );

  return (
    <div
      className={cx(
        'rounded-[18px] bg-white p-3.5 shadow-[0_1px_0_#eceaf5]',
        first ? 'mt-2.5' : 'mt-2',
        !expanded && 'flex items-center justify-between gap-3',
      )}
    >
      {expanded ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onEdit}
              className="min-w-0 truncate text-left text-[15px] font-bold hover:underline"
            >
              {name}
            </button>
            {filters}
          </div>
          <ValueChips attribute={attribute} onReorder={onReorderValues} onOpen={onOpenValue} onAdd={onAddValue} />
          <p className="mt-2 text-[12px] text-ink-muted">
            {count > 0 ? (
              <Trans>Порядок значений — как на витрине. Перетаскивайте.</Trans>
            ) : (
              <Trans>Значений пока нет — добавьте их или загрузите Excel.</Trans>
            )}
          </p>
        </>
      ) : (
        <>
          <button type="button" aria-expanded={false} onClick={onExpand} className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[15px] font-bold">{name}</span>
            <span className="block truncate text-[13px] text-ink-quiet">
              {range && `${range} · `}
              <Plural value={count} _0="значений пока нет" one="# значение" few="# значения" other="# значений" />
            </span>
          </button>
          {filters}
        </>
      )}
    </div>
  );
}
