import { formatAmount, formatPrice } from '@catalog/ui';
import { useState, type InputHTMLAttributes } from 'react';

import { digitsOf } from '../../lib';

/**
 * Цена в поле: пока поле не в фокусе — «18 900 ₸» (или «8 200» без `suffix`), при вводе — только цифры.
 * `fallback` — цена по умолчанию серой подсказкой, пока своей нет (размеры нового товара).
 */
export function AmountInput({
  value,
  fallback,
  suffix = true,
  onValueChange,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  fallback?: string;
  suffix?: boolean;
  onValueChange: (digits: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const format = (digits: string) => (suffix ? formatPrice(Number(digits)) : formatAmount(Number(digits)));
  return (
    <input
      inputMode="numeric"
      autoComplete="off"
      value={focused || !value ? value : format(value)}
      placeholder={fallback ? format(fallback) : undefined}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(event) => onValueChange(digitsOf(event.target.value).slice(0, 9))}
      {...rest}
    />
  );
}
