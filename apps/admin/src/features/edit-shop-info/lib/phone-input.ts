import { formatPhone, PHONE_DIGITS } from '@/entities/shop';

/** Номер для поля: «+7 700 000 00 00», пока цифр нет — пусто (видна подсказка). */
export const phoneText = (digits: string): string => (digits ? `+7 ${formatPhone(digits)}` : '');

/** Набранное в поле — к 10 цифрам после +7: «+7 700…» и «8 700…» без кода страны, просто цифры — как есть. */
export function phoneDigits(input: string): string {
  const trimmed = input.trim();
  let digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+7')) digits = digits.slice(1);
  else if (digits.length > PHONE_DIGITS && (digits.startsWith('7') || digits.startsWith('8'))) digits = digits.slice(1);
  return digits.slice(0, PHONE_DIGITS);
}
