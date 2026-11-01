/** Отправленная заявка — для экрана «Отправлено ✓». Живёт только в памяти страницы: заказы мы не храним (D14). */
export type SentOrder = {
  subdomain: string;
  /** Готовая ссылка `wa.me/<номер>?text=…` — чтобы открыть WhatsApp ещё раз. */
  url: string;
  /** Текст заявки целиком — для кнопки «Скопировать текст» (S11). */
  text: string;
  count: number;
  total: number;
  /** Миниатюры позиций. */
  photos: (string | null)[];
};
