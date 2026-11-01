import type { StorefrontFacets } from '@catalog/contract';

import type { ActiveValueFilter, FilterSection, FilterState } from '../types';

/**
 * Разделы шторки фильтров. Показываем значения, которые есть в текущей выборке (`current`),
 * и всегда — уже выбранные, даже если в выборке их больше нет (`all` — весь магазин), чтобы их можно было снять.
 */
export function buildFilterSections(
  all: StorefrontFacets,
  current: StorefrontFacets,
  selected: string[],
): FilterSection[] {
  const chosen = new Set(selected);
  const present = new Set(current.attributes.flatMap((attribute) => attribute.values.map((value) => value.id)));
  return all.attributes
    .map((attribute) => ({
      id: attribute.id,
      name: attribute.name,
      values: attribute.values
        .filter((value) => present.has(value.id) || chosen.has(value.id))
        .map((value) => ({ id: value.id, value: value.value, selected: chosen.has(value.id) })),
    }))
    .filter((section) => section.values.length > 0);
}

/** Выбранные значения с названием свойства — для чипов под категориями. Неизвестные id пропускаем. */
export function getActiveValueFilters(all: StorefrontFacets, selected: string[]): ActiveValueFilter[] {
  const known = new Map<string, ActiveValueFilter>();
  for (const attribute of all.attributes) {
    for (const value of attribute.values) {
      known.set(value.id, { id: value.id, attributeName: attribute.name, value: value.value });
    }
  }
  return selected.flatMap((id) => known.get(id) ?? []);
}

/** Сколько фильтров включено: каждое значение и диапазон цены считаются по одному. */
export function countActiveFilters(state: FilterState): number {
  const hasPrice = state.priceMin !== undefined || state.priceMax !== undefined;
  return state.values.length + (hasPrice ? 1 : 0);
}

export function toggleValue(values: string[], id: string): string[] {
  return values.includes(id) ? values.filter((entry) => entry !== id) : [...values, id];
}

/** Поле цены → число: пусто или мусор — «не задано». */
export function parsePrice(input: string): number | undefined {
  const digits = input.replace(/\D/g, '');
  return digits ? Number(digits) : undefined;
}
