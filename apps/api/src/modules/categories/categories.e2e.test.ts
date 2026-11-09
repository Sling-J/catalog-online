import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { connectTestDb } from '../../../test/helpers/db.js';
import { signUp, XRW, type Browser } from '../../../test/helpers/session.js';
import type { Db } from '../../core/db/index.js';
import { categories } from '../../core/db/schema/index.js';

const NO_SUCH = '0192d000-0000-7000-8000-00000000ffff';

describe('категории', () => {
  let t: TestApp;
  let db: Db;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    t = await createTestApp();
    ({ db, close: closeDb } = connectTestDb(t.config.databaseUrl));
  });
  afterAll(async () => {
    await closeDb?.();
    await t?.close();
  });

  const shop = async (email: string): Promise<Browser> => (await signUp(t, email)).agent;
  const create = (agent: Browser, name: string, parentId: string | null = null) =>
    agent.post('/v1/admin/categories').set(XRW).send({ name, parentId });
  const tree = async (agent: Browser) => (await agent.get('/v1/admin/categories').expect(200)).body;
  const product = (agent: Browser, categoryId: string) =>
    agent
      .post('/v1/admin/products')
      .set(XRW)
      .send({ name: 'Товар', categoryId, variants: [{ price: 1000, stock: 1, values: [] }] })
      .expect(201);
  const paths = async (ids: string[]) =>
    Object.fromEntries(
      await Promise.all(
        ids.map(async (id) => {
          const [row] = await db.select().from(categories).where(eq(categories.id, id));
          return [row!.name, row!.path];
        }),
      ),
    );

  it('без сессии — 401', async () => {
    await request(t.app.getHttpServer()).get('/v1/admin/categories').expect(401);
  });

  it('создание: в конец своего уровня, подкатегория, дерево с числом своих товаров', async () => {
    const agent = await shop('cat-create@example.com');
    expect(await tree(agent)).toEqual([]);
    const girls = (await create(agent, '  Девочки ').expect(201)).body;
    expect(girls).toMatchObject({ name: 'Девочки', parentId: null, position: 0, productCount: 0, children: [] });
    const boys = (await create(agent, 'Мальчики').expect(201)).body;
    const jackets = (await create(agent, 'Куртки', girls.id).expect(201)).body;
    expect(boys.position).toBe(1);
    expect(jackets).toMatchObject({ parentId: girls.id, position: 0 });
    await product(agent, jackets.id);
    await product(agent, jackets.id);
    await product(agent, girls.id);
    expect(await tree(agent)).toEqual([
      {
        ...girls,
        productCount: 1,
        children: [{ ...jackets, productCount: 2 }],
      },
      boys,
    ]);
    expect(await paths([girls.id, jackets.id])).toEqual({ Девочки: 'Девочки', Куртки: 'Девочки / Куртки' });
  });

  it('создание: повтор имени среди соседей — 409, в другом родителе — можно; третий уровень и пустое имя — 422', async () => {
    const agent = await shop('cat-rules@example.com');
    const girls = (await create(agent, 'Девочки').expect(201)).body;
    const boys = (await create(agent, 'Мальчики').expect(201)).body;
    const jackets = (await create(agent, 'Куртки', girls.id).expect(201)).body;
    expect((await create(agent, 'девочки ').expect(409)).body.code).toBe('category_name_taken');
    expect((await create(agent, 'КУРТКИ', girls.id).expect(409)).body.code).toBe('category_name_taken');
    await create(agent, 'Куртки', boys.id).expect(201);
    await create(agent, 'Куртки').expect(201);
    expect((await create(agent, 'Зимние', jackets.id).expect(422)).body.errors).toEqual([
      { field: 'parentId', code: 'too_deep' },
    ]);
    expect((await create(agent, 'Зимние', NO_SUCH).expect(422)).body.errors).toEqual([
      { field: 'parentId', code: 'not_found' },
    ]);
    expect((await create(agent, '   ').expect(422)).body.errors).toEqual([{ field: 'name', code: 'required' }]);
  });

  it('переименование: повтор — 409; путь подкатегорий обновляется', async () => {
    const agent = await shop('cat-rename@example.com');
    const girls = (await create(agent, 'Девочки').expect(201)).body;
    await create(agent, 'Мальчики').expect(201);
    const jackets = (await create(agent, 'Куртки', girls.id).expect(201)).body;
    const rename = (id: string, name: string) => agent.patch(`/v1/admin/categories/${id}`).set(XRW).send({ name });
    expect((await rename(girls.id, 'мальчики').expect(409)).body.code).toBe('category_name_taken');
    const { body } = await rename(girls.id, ' Для девочек ').expect(200);
    expect(body).toMatchObject({ id: girls.id, name: 'Для девочек', children: [{ id: jackets.id }] });
    await rename(girls.id, 'для девочек').expect(200); // своё же имя в другом регистре
    expect(await paths([girls.id, jackets.id])).toEqual({
      'для девочек': 'для девочек',
      Куртки: 'для девочек / Куртки',
    });
    await rename(NO_SUCH, 'X').expect(404);
  });

  it('порядок и вложенность целиком; обмен местами одноимённых категорий', async () => {
    const agent = await shop('cat-order@example.com');
    const girls = (await create(agent, 'Девочки').expect(201)).body;
    const boys = (await create(agent, 'Мальчики').expect(201)).body;
    const girlsJackets = (await create(agent, 'Куртки', girls.id).expect(201)).body;
    const rootJackets = (await create(agent, 'Куртки').expect(201)).body;
    const order = (items: object[]) => agent.put('/v1/admin/categories/order').set(XRW).send({ items });

    // корневые «Куртки» уходят в «Девочки», а «Куртки» девочек — в корень, первыми
    const { body } = await order([
      { id: girlsJackets.id, parentId: null, position: 0 },
      { id: boys.id, parentId: null, position: 1 },
      { id: girls.id, parentId: null, position: 2 },
      { id: rootJackets.id, parentId: girls.id, position: 0 },
    ]).expect(200);
    expect(
      body.map((node: { id: string; children: { id: string }[] }) => [node.id, node.children.map((c) => c.id)]),
    ).toEqual([
      [girlsJackets.id, []],
      [boys.id, []],
      [girls.id, [rootJackets.id]],
    ]);
    expect(body.map((node: { position: number }) => node.position)).toEqual([0, 1, 2]);
    expect(await tree(agent)).toEqual(body);
    const [moved] = await db.select().from(categories).where(eq(categories.id, rootJackets.id));
    expect(moved!.path).toBe('Девочки / Куртки');

    // неполный список, третий уровень, повтор имени у соседей — 422, ничего не меняется
    await order([{ id: girls.id, parentId: null, position: 0 }]).expect(422);
    await order([
      { id: girlsJackets.id, parentId: null, position: 0 },
      { id: boys.id, parentId: girls.id, position: 0 },
      { id: girls.id, parentId: null, position: 1 },
      { id: rootJackets.id, parentId: boys.id, position: 0 },
    ]).expect(422);
    const duplicate = await order([
      { id: girlsJackets.id, parentId: null, position: 0 },
      { id: boys.id, parentId: null, position: 1 },
      { id: girls.id, parentId: null, position: 2 },
      { id: rootJackets.id, parentId: null, position: 3 },
    ]).expect(422);
    expect(duplicate.body.errors).toEqual([{ field: 'items.3.id', code: 'duplicate' }]);
    expect(await tree(agent)).toEqual(body);
  });

  it('удаление: товары без категории, соседи сдвигаются; с подкатегориями — 409', async () => {
    const agent = await shop('cat-delete@example.com');
    const girls = (await create(agent, 'Девочки').expect(201)).body;
    const boys = (await create(agent, 'Мальчики').expect(201)).body;
    const shoes = (await create(agent, 'Обувь').expect(201)).body;
    await create(agent, 'Куртки', girls.id).expect(201);
    const { body: item } = await product(agent, boys.id);

    expect((await agent.delete(`/v1/admin/categories/${girls.id}`).set(XRW).expect(409)).body.code).toBe(
      'category_has_children',
    );
    await agent.delete(`/v1/admin/categories/${boys.id}`).set(XRW).expect(204);
    expect((await agent.get(`/v1/admin/products/${item.id}`).expect(200)).body.categoryId).toBeNull();
    expect((await tree(agent)).map((node: { id: string; position: number }) => [node.id, node.position])).toEqual([
      [girls.id, 0],
      [shoes.id, 1],
    ]);
    await agent.delete(`/v1/admin/categories/${boys.id}`).set(XRW).expect(404);
  });

  it('чужой магазин: не видит и не меняет; товару чужую категорию не поставить', async () => {
    const owner = await shop('cat-owner@example.com');
    const other = await shop('cat-other@example.com');
    const girls = (await create(owner, 'Девочки').expect(201)).body;
    expect(await tree(other)).toEqual([]);
    await other.patch(`/v1/admin/categories/${girls.id}`).set(XRW).send({ name: 'Моё' }).expect(404);
    await other.delete(`/v1/admin/categories/${girls.id}`).set(XRW).expect(404);
    expect((await create(other, 'Куртки', girls.id).expect(422)).body.errors).toEqual([
      { field: 'parentId', code: 'not_found' },
    ]);
    await other
      .put('/v1/admin/categories/order')
      .set(XRW)
      .send({ items: [{ id: girls.id, parentId: null, position: 0 }] })
      .expect(422);
    const res = await other
      .post('/v1/admin/products')
      .set(XRW)
      .send({ name: 'Товар', categoryId: girls.id, variants: [{ price: 1, stock: 1, values: [] }] })
      .expect(422);
    expect(res.body.errors).toEqual([{ field: 'categoryId', code: 'not_found' }]);
    await other.delete('/v1/admin/categories/not-a-uuid').set(XRW).expect(404);
    expect(await tree(owner)).toHaveLength(1);
  });
});
