import { zCategory, zGetProductCountsResponse, zDeleteCategoryResponse } from '@catalog/contract/zod';
import { describe, expect, it } from 'vitest';

import { checkResponse } from './response-check.interceptor.js';

const counts = { all: 3, noPhoto: 1, outOfStock: 0, hidden: 2 };
const category = {
  id: '0192d000-0000-7000-8000-000000000001',
  name: 'Куртки',
  parentId: null,
  position: 0,
  productCount: 0,
};

describe('сверка ответа с контрактом', () => {
  it('ответ по схеме проходит без изменений, 204 — пустой', () => {
    expect(checkResponse('getProductCounts', zGetProductCountsResponse, counts)).toBe(counts);
    expect(checkResponse('deleteCategory', zDeleteCategoryResponse, undefined)).toBeUndefined();
  });

  it('не тот тип или нет поля — ошибка', () => {
    expect(() => checkResponse('getProductCounts', zGetProductCountsResponse, { ...counts, all: '3' })).toThrow(
      /не по контракту/,
    );
    expect(() => checkResponse('getProductCounts', zGetProductCountsResponse, { all: 3 })).toThrow(/не по контракту/);
  });

  it('лишние поля — ошибка с путём, в том числе во вложенных', () => {
    expect(() => checkResponse('getProductCounts', zGetProductCountsResponse, { ...counts, secret: 1 })).toThrow(
      /secret/,
    );
    const tree = { ...category, children: [{ ...category, children: [], path: 'Девочки / Куртки' }] };
    expect(() => checkResponse('createCategory', zCategory, tree)).toThrow(/children\.0\.path/);
  });

  it('проверяется то, что уйдёт клиенту: поля со значением undefined JSON отбрасывает', () => {
    expect(() =>
      checkResponse('getProductCounts', zGetProductCountsResponse, { ...counts, debug: undefined }),
    ).not.toThrow();
  });
});
