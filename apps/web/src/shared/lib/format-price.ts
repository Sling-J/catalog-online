const number = new Intl.NumberFormat('ru-RU');
const NBSP = String.fromCharCode(0xa0);

/** «18 900»: разряды через неразрывный пробел — для подсказок в полях, где знак тенге уже в подписи. */
export function formatAmount(value: number): string {
  return number.format(value).replace(/\s/g, NBSP);
}

/** «18 900 ₸»: разряды и знак тенге через неразрывный пробел, чтобы цена не переносилась. */
export function formatPrice(value: number): string {
  return `${formatAmount(value)}${NBSP}₸`;
}
