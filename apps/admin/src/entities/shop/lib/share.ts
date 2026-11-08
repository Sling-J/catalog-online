/** Ссылка «Отправить в WhatsApp»: чат выбирает сам человек, текст — адрес витрины. */
export const whatsappShareUrl = (text: string): string => `https://wa.me/?text=${encodeURIComponent(text)}`;
