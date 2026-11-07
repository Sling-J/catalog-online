import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { Attribute, Category, Problem, Product } from '../gen/types.gen.js';
import { demoAdminHandlers } from './admin-handlers.js';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const fresh = () => server.use(...demoAdminHandlers());
const send = (method: string, path: string, body?: unknown) =>
  fetch(`http://api.test/v1${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const json = async <T>(method: string, path: string, body?: unknown): Promise<T> =>
  (await send(method, path, body)).json() as Promise<T>;
const tree = () => json<Category[]>('GET', '/admin/categories');
const attributes = () => json<Attribute[]>('GET', '/admin/attributes');
const order = (categories: Category[]) =>
  categories.flatMap((category, position) => [
    { id: category.id, parentId: null as string | null, position },
    ...category.children.map((child, index) => ({
      id: child.id,
      parentId: category.id as string | null,
      position: index,
    })),
  ]);

describe('моки админки: категории', () => {
  it('новая категория — в конце, повтор имени у соседей — 409', async () => {
    fresh();
    const before = await tree();
    const created = await send('POST', '/admin/categories', { name: 'Пижамы' });
    expect(created.status).toBe(201);
    const after = await tree();
    expect(after.at(-1)).toMatchObject({ name: 'Пижамы', position: before.length, productCount: 0, children: [] });
    const taken = await send('POST', '/admin/categories', { name: ' пижамы ' });
    expect(taken.status).toBe(409);
    expect(((await taken.json()) as Problem).code).toBe('category_name_taken');
  });

  it('подкатегория: только на втором уровне; то же имя под другим родителем можно', async () => {
    fresh();
    const [first, second] = await tree();
    const child = await json<Category>('POST', '/admin/categories', { name: 'Девочки', parentId: first!.id });
    expect((await send('POST', '/admin/categories', { name: 'Девочки', parentId: second!.id })).status).toBe(201);
    expect((await send('POST', '/admin/categories', { name: 'Ещё', parentId: child.id })).status).toBe(422);
    expect((await tree())[0]!.children.map((item) => item.name)).toEqual(['Девочки']);
  });

  it('порядок и вложенность — целиком; третий уровень и вложение родителя — 422', async () => {
    fresh();
    const categories = await tree();
    const items = order(categories)
      .reverse()
      .map((item, position) => ({ ...item, position }));
    const reordered = await json<Category[]>('PUT', '/admin/categories/order', { items });
    expect(reordered.map((item) => item.id)).toEqual(categories.map((item) => item.id).reverse());

    // вторую категорию — внутрь первой
    const [a, b, c] = reordered;
    const nested = order(reordered).map((item) =>
      item.id === b!.id ? { ...item, parentId: a!.id, position: 0 } : item,
    );
    const result = await json<Category[]>('PUT', '/admin/categories/order', { items: nested });
    expect(result[0]!.children.map((item) => item.id)).toEqual([b!.id]);
    expect(result.map((item) => item.position)).toEqual(result.map((_, index) => index));

    // третий уровень
    const deep = order(result).map((item) => (item.id === c!.id ? { ...item, parentId: b!.id } : item));
    expect((await send('PUT', '/admin/categories/order', { items: deep })).status).toBe(422);
    // родителя с подкатегорией — внутрь другой
    const parent = order(result).map((item) => (item.id === a!.id ? { ...item, parentId: c!.id } : item));
    expect((await send('PUT', '/admin/categories/order', { items: parent })).status).toBe(422);
    // не все категории
    expect((await send('PUT', '/admin/categories/order', { items: order(result).slice(1) })).status).toBe(422);
  });

  it('переименование и удаление: товары без категории; с подкатегориями — 409', async () => {
    fresh();
    const [first, second] = await tree();
    expect((await send('PATCH', `/admin/categories/${first!.id}`, { name: second!.name })).status).toBe(409);
    expect(await json<Category>('PATCH', `/admin/categories/${first!.id}`, { name: 'Верхняя одежда' })).toMatchObject({
      name: 'Верхняя одежда',
    });
    const child = await json<Category>('POST', '/admin/categories', { name: 'Зима', parentId: first!.id });
    const blocked = await send('DELETE', `/admin/categories/${first!.id}`);
    expect(blocked.status).toBe(409);
    expect(((await blocked.json()) as Problem).code).toBe('category_has_children');
    expect((await send('DELETE', `/admin/categories/${child.id}`)).status).toBe(204);
    expect((await send('DELETE', `/admin/categories/${first!.id}`)).status).toBe(204);
    const after = await tree();
    expect(after[0]).toMatchObject({ id: second!.id, position: 0 });
    const list = await json<{ items: { category: unknown }[] }>('GET', `/admin/products?categoryId=${first!.id}`);
    expect(list.items).toHaveLength(0);
    expect((await send('DELETE', `/admin/categories/${first!.id}`)).status).toBe(404);
  });
});

describe('моки админки: свойства', () => {
  it('новое свойство со значениями; повтор имени — 409', async () => {
    fresh();
    const created = await json<Attribute>('POST', '/admin/attributes', {
      name: 'Цвет',
      values: ['синий', 'Синий', 'красный'],
    });
    expect(created).toMatchObject({ name: 'Цвет', inFilters: true });
    expect(created.values.map((item) => item.value)).toEqual(['синий', 'красный']);
    const taken = await send('POST', '/admin/attributes', { name: 'рост' });
    expect(((await taken.json()) as Problem).code).toBe('attribute_name_taken');
  });

  it('«в фильтрах» и переименование; новое имя видно в вариантах товаров', async () => {
    fresh();
    const [height] = await attributes();
    const updated = await json<Attribute>('PATCH', `/admin/attributes/${height!.id}`, {
      name: 'Рост, см',
      inFilters: false,
    });
    expect(updated).toMatchObject({ name: 'Рост, см', inFilters: false });
    const { items } = await json<{ items: { id: string }[] }>('GET', '/admin/products?limit=100');
    const products = await Promise.all(items.map((item) => json<Product>('GET', `/admin/products/${item.id}`)));
    const names = products.flatMap((product) => product.variants.flatMap((variant) => variant.values));
    expect(names.some((value) => value.attributeId === height!.id && value.attributeName === 'Рост, см')).toBe(true);
  });

  it('значения: порядок и добавление; используемое удалить нельзя, неиспользуемое можно', async () => {
    fresh();
    const [height] = await attributes();
    const used = height!.values.find((item) => item.usageCount > 0)!;
    const reversed = [...height!.values].reverse().map(({ id, value }) => ({ id, value }));
    const next = await json<Attribute>('PUT', `/admin/attributes/${height!.id}/values`, {
      values: [...reversed, { value: '146' }],
    });
    expect(next.values.map((item) => item.value)).toEqual([...reversed.map((item) => item.value), '146']);

    const withoutUsed = next.values.filter((item) => item.id !== used.id).map(({ id, value }) => ({ id, value }));
    const inUse = await send('PUT', `/admin/attributes/${height!.id}/values`, { values: withoutUsed });
    expect(inUse.status).toBe(409);
    expect(((await inUse.json()) as Problem).code).toBe('attribute_value_in_use');

    const withoutNew = next.values.filter((item) => item.value !== '146').map(({ id, value }) => ({ id, value }));
    const removed = await json<Attribute>('PUT', `/admin/attributes/${height!.id}/values`, { values: withoutNew });
    expect(removed.values.some((item) => item.value === '146')).toBe(false);
    // повтор значения
    const twice = await send('PUT', `/admin/attributes/${height!.id}/values`, {
      values: [...withoutNew, { value: withoutNew[0]!.value }],
    });
    expect(twice.status).toBe(409);
    expect((await twice.json()) as Problem).toMatchObject({
      code: 'attribute_value_taken',
      errors: [{ field: `values.${withoutNew.length}.value`, code: 'taken' }],
    });
  });

  it('удаление свойства снимает его значения с вариантов', async () => {
    fresh();
    const [height] = await attributes();
    expect((await send('DELETE', `/admin/attributes/${height!.id}`)).status).toBe(204);
    expect((await attributes()).some((item) => item.id === height!.id)).toBe(false);
    const { items } = await json<{ items: { id: string }[] }>('GET', '/admin/products?limit=100');
    const products = await Promise.all(items.map((item) => json<Product>('GET', `/admin/products/${item.id}`)));
    const values = products.flatMap((product) => product.variants.flatMap((variant) => variant.values));
    expect(values.some((value) => value.attributeId === height!.id)).toBe(false);
  });
});
