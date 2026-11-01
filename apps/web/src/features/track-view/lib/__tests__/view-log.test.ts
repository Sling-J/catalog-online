import { describe, expect, it } from 'vitest';

import { shouldTrackView, viewKey } from '../view-log';

const memoryStorage = (): Storage => {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
};

describe('просмотры без повторов за сутки', () => {
  it('первый просмотр витрины и товара отправляем, повтор в тот же день — нет', () => {
    const storage = memoryStorage();
    const day = new Date(2026, 10, 2, 10);
    expect(shouldTrackView(storage, viewKey('aigerim-kids'), day)).toBe(true);
    expect(shouldTrackView(storage, viewKey('aigerim-kids'), day)).toBe(false);
    expect(shouldTrackView(storage, viewKey('aigerim-kids', 'p1'), day)).toBe(true);
    expect(shouldTrackView(storage, viewKey('aigerim-kids', 'p1'), day)).toBe(false);
  });

  it('на следующий день считаем снова', () => {
    const storage = memoryStorage();
    expect(shouldTrackView(storage, viewKey('aigerim-kids'), new Date(2026, 10, 2, 23))).toBe(true);
    expect(shouldTrackView(storage, viewKey('aigerim-kids'), new Date(2026, 10, 3, 0, 5))).toBe(true);
  });

  it('без хранилища или с испорченной записью — отправляем', () => {
    expect(shouldTrackView(undefined, viewKey('aigerim-kids'))).toBe(true);
    const storage = memoryStorage();
    storage.setItem('catalog:views', '{oops');
    expect(shouldTrackView(storage, viewKey('aigerim-kids'))).toBe(true);
  });
});
