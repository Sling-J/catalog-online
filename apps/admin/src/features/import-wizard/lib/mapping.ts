import type { ColumnMapping } from '@catalog/contract';

export type MappingTarget = ColumnMapping['target'];
export type FieldTarget = Exclude<MappingTarget, 'attribute' | 'skip'>;

/** Обязательные поля (FR-A3): без них «Дальше» не пустит. */
export const REQUIRED_TARGETS: FieldTarget[] = ['sku', 'name', 'price', 'stock'];
/** Поля по порядку в списке «Куда загрузить». */
export const FIELD_TARGETS: FieldTarget[] = [...REQUIRED_TARGETS, 'group_key', 'barcode', 'category', 'description'];

const ATTRIBUTE_PREFIX = 'attribute:';

/** Значение пункта списка: поле, «не загружать» или свойство с именем (`attribute:Рост`). */
export const mappingValue = (item: ColumnMapping): string =>
  item.target === 'attribute' ? `${ATTRIBUTE_PREFIX}${item.attributeName ?? item.column}` : item.target;

export function mappingFromValue(column: string, value: string): ColumnMapping {
  if (value.startsWith(ATTRIBUTE_PREFIX)) {
    return { column, target: 'attribute', attributeName: value.slice(ATTRIBUTE_PREFIX.length) };
  }
  return { column, target: value as MappingTarget, attributeName: null };
}

/** Обязательные поля, которым не досталось колонки. */
export const missingTargets = (mapping: ColumnMapping[]): FieldTarget[] =>
  REQUIRED_TARGETS.filter((target) => !mapping.some((item) => item.target === target));

/** Поля, выбранные у двух и больше колонок: так нельзя (свойств и «не загружать» — сколько угодно). */
export function repeatedTargets(mapping: ColumnMapping[]): FieldTarget[] {
  const seen = new Set<FieldTarget>();
  const repeated = new Set<FieldTarget>();
  for (const { target } of mapping) {
    if (target === 'attribute' || target === 'skip') continue;
    if (seen.has(target)) repeated.add(target);
    seen.add(target);
  }
  return [...repeated];
}
