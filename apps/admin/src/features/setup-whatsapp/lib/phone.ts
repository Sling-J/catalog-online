/** Цифр в казахстанском номере после +7 (контракт: `^\+7\d{10}$`). */
export const PHONE_DIGITS = 10;

/** «7000000000» → «700 000 00 00»: группы 3-3-2-2, как в макете. */
export function formatPhone(digits: string): string {
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)].filter(Boolean).join(' ');
}

/** Ссылка на чат WhatsApp с этим номером и готовым текстом. */
export function whatsappTestLink(digits: string, text: string): string {
  return `https://wa.me/7${digits}?text=${encodeURIComponent(text)}`;
}
