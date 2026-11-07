import type { Attribute } from '@catalog/contract';

/**
 * Краткий диапазон значений для свёрнутой карточки свойства («24–31», макет AdminPhone2): только если все значения —
 * числа. Иначе `null` — подпись обходится числом значений.
 */
export function valuesRange(values: Attribute['values']): string | null {
  if (values.length < 2) return null;
  const numbers = values.map((entry) => Number(entry.value.replace(',', '.')));
  if (numbers.some((value) => !Number.isFinite(value)) || values.some((entry) => !entry.value.trim())) return null;
  const min = values[numbers.indexOf(Math.min(...numbers))]!.value;
  const max = values[numbers.indexOf(Math.max(...numbers))]!.value;
  return `${min}–${max}`;
}
