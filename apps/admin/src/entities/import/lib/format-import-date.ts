const format = new Intl.DateTimeFormat('ru', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

/** Когда начали импорт: «24 октября, 10:12» (по часам устройства). */
export const formatImportDate = (iso: string): string => format.format(new Date(iso));
