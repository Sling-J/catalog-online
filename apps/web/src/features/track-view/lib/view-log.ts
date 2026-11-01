const STORAGE_KEY = 'catalog:views';

/** Что уже отправлено сегодня: дата покупателя и ключи «магазин / товар». */
type ViewLog = { date: string; keys: string[] };

const MAX_KEYS = 500;

const today = (now: Date): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

const read = (storage: Storage): ViewLog | undefined => {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const log = raw ? (JSON.parse(raw) as unknown) : undefined;
    if (log && typeof log === 'object' && 'date' in log && 'keys' in log && Array.isArray(log.keys)) {
      return log as ViewLog;
    }
  } catch {
    // нет доступа к хранилищу или кривая запись — считаем, что сегодня ничего не отправляли
  }
  return undefined;
};

/**
 * Отмечает просмотр и отвечает, нужно ли его отправлять: один раз в сутки на витрину и на каждый товар.
 * Сутки — по часам покупателя; сервер всё равно отсекает повторы сам (cookie на сутки, DM4), здесь —
 * чтобы не слать лишние запросы. Без хранилища (приватный режим) отправляем всегда.
 */
export function shouldTrackView(storage: Storage | undefined, key: string, now = new Date()): boolean {
  if (!storage) return true;
  const date = today(now);
  const log = read(storage);
  const keys = log?.date === date ? log.keys : [];
  if (keys.includes(key)) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ date, keys: [...keys, key].slice(-MAX_KEYS) } satisfies ViewLog));
  } catch {
    // хранилище переполнено или закрыто — просто отправим
  }
  return true;
}

/** Ключ просмотра: витрина целиком или товар. */
export const viewKey = (subdomain: string, productId?: string): string => `${subdomain}/${productId ?? ''}`;
