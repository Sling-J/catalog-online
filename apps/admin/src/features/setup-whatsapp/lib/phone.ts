/** Ссылка на чат WhatsApp с этим номером и готовым текстом. */
export function whatsappTestLink(digits: string, text: string): string {
  return `https://wa.me/7${digits}?text=${encodeURIComponent(text)}`;
}
