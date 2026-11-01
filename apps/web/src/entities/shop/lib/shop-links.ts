/** Ссылка на чат WhatsApp магазина; `text` — готовое сообщение (S9). */
export function whatsappLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '');
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

/** Поиск адреса в 2ГИС: точных координат у магазина нет, ищем по тексту адреса. */
export function twoGisLink(address: string): string {
  return `https://2gis.kz/search/${encodeURIComponent(address)}`;
}

export function instagramLink(handle: string): string {
  return `https://instagram.com/${handle.replace(/^@/, '')}`;
}

/** «+77000000000» → «+7 700 000 00 00»; нестандартный номер возвращаем как есть. */
export function formatPhone(phone: string): string {
  const match = /^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return match ? `+7 ${match[1]} ${match[2]} ${match[3]} ${match[4]}` : phone;
}
