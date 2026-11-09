import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { signUp, XRW, type Browser } from '../../../test/helpers/session.js';

const NO_SUCH = '0192d000-0000-7000-8000-00000000ffff';

type Value = { id: string; value: string; position: number; usageCount: number };
type Attribute = { id: string; name: string; position: number; inFilters: boolean; values: Value[] };

describe('свойства', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t?.close();
  });

  const shop = async (email: string): Promise<Browser> => (await signUp(t, email)).agent;
  const create = (agent: Browser, body: object) => agent.post('/v1/admin/attributes').set(XRW).send(body);
  const list = async (agent: Browser): Promise<Attribute[]> =>
    (await agent.get('/v1/admin/attributes').expect(200)).body;
  const putValues = (agent: Browser, id: string, values: object[]) =>
    agent.put(`/v1/admin/attributes/${id}/values`).set(XRW).send({ values });
  const product = (agent: Browser, variants: object[]) =>
    agent.post('/v1/admin/products').set(XRW).send({ name: 'Платье', variants }).expect(201);
  const valuesOf = (attribute: Attribute) => attribute.values.map((value) => value.value);

  it('без сессии — 401', async () => {
    await request(t.app.getHttpServer()).get('/v1/admin/attributes').expect(401);
  });

  it('создание: значения без повторов, в конец списка; повтор имени — 409', async () => {
    const agent = await shop('attr-create@example.com');
    const { body: rost } = await create(agent, { name: ' Рост ', values: ['92', ' 98 ', '92', '  '] }).expect(201);
    expect(rost).toMatchObject({ name: 'Рост', position: 0, inFilters: true });
    expect(rost.values).toMatchObject([
      { value: '92', position: 0, usageCount: 0 },
      { value: '98', position: 1, usageCount: 0 },
    ]);
    const { body: color } = await create(agent, { name: 'Цвет', inFilters: false }).expect(201);
    expect(color).toMatchObject({ position: 1, inFilters: false, values: [] });
    expect((await create(agent, { name: 'рост' }).expect(409)).body.code).toBe('attribute_name_taken');
    expect((await create(agent, { name: '  ' }).expect(422)).body.errors).toEqual([
      { field: 'name', code: 'required' },
    ]);
    expect(await list(agent)).toEqual([rost, color]);
  });

  it('изменение: имя и «в фильтрах», повтор — 409; имя меняется и в вариантах', async () => {
    const agent = await shop('attr-update@example.com');
    const { body: rost } = await create(agent, { name: 'Рост', values: ['92'] }).expect(201);
    await create(agent, { name: 'Цвет' }).expect(201);
    const { body: item } = await product(agent, [
      { price: 1, stock: 1, values: [{ attributeId: rost.id, value: '92' }] },
    ]);
    const patch = (body: object) => agent.patch(`/v1/admin/attributes/${rost.id}`).set(XRW).send(body);
    expect((await patch({ name: 'ЦВЕТ' }).expect(409)).body.code).toBe('attribute_name_taken');
    expect((await patch({ inFilters: false }).expect(200)).body).toMatchObject({ name: 'Рост', inFilters: false });
    expect((await patch({ name: 'Рост ребёнка' }).expect(200)).body).toMatchObject({
      name: 'Рост ребёнка',
      inFilters: false,
      values: [{ value: '92', usageCount: 1 }],
    });
    const { body: after } = await agent.get(`/v1/admin/products/${item.id}`).expect(200);
    expect(after.variants[0].values).toMatchObject([{ attributeName: 'Рост ребёнка', value: '92' }]);
    await agent.patch(`/v1/admin/attributes/${NO_SUCH}`).set(XRW).send({ inFilters: true }).expect(404);
  });

  it('значения целиком: переименовать, переставить, добавить, удалить неиспользуемое; обмен значений', async () => {
    const agent = await shop('attr-values@example.com');
    const { body: size } = await create(agent, { name: 'Размер', values: ['S', 'M', 'L'] }).expect(201);
    const [s, m, l] = size.values as Value[];
    const { body: item } = await product(agent, [
      { price: 1, stock: 1, values: [{ attributeId: size.id, value: 'M' }] },
    ]);

    // S и M меняются названиями, L удаляется, XL добавляется первым
    const { body } = await putValues(agent, size.id, [
      { value: ' XL ' },
      { id: m!.id, value: 'S' },
      { id: s!.id, value: 'M' },
    ]).expect(200);
    expect(body.values.map((value: Value) => [value.value, value.position, value.usageCount])).toEqual([
      ['XL', 0, 0],
      ['S', 1, 1],
      ['M', 2, 0],
    ]);
    expect(body.values[1].id).toBe(m!.id);
    expect(body.values.some((value: Value) => value.id === l!.id)).toBe(false);
    // у варианта было значение «M» (id m) — теперь оно называется «S»
    const { body: after } = await agent.get(`/v1/admin/products/${item.id}`).expect(200);
    expect(after.variants[0].values).toMatchObject([{ valueId: m!.id, value: 'S' }]);
    expect((await list(agent))[0]).toEqual(body);
  });

  it('значения: удалить используемое — 409 in_use, повтор — 409 taken с ячейкой, чужой id — 422', async () => {
    const agent = await shop('attr-values-errors@example.com');
    const { body: size } = await create(agent, { name: 'Размер', values: ['S', 'M'] }).expect(201);
    const [s, m] = size.values as Value[];
    await product(agent, [{ price: 1, stock: 1, values: [{ attributeId: size.id, value: 'S' }] }]);

    expect((await putValues(agent, size.id, [{ id: m!.id, value: 'M' }]).expect(409)).body.code).toBe(
      'attribute_value_in_use',
    );
    const taken = await putValues(agent, size.id, [
      { id: s!.id, value: 'S' },
      { id: m!.id, value: 'M' },
      { value: 'm' },
    ]).expect(409);
    expect(taken.body).toMatchObject({
      code: 'attribute_value_taken',
      errors: [{ field: 'values.2.value', code: 'taken' }],
    });
    const invalid = await putValues(agent, size.id, [{ id: NO_SUCH, value: 'S' }]).expect(422);
    expect(invalid.body.errors).toEqual([{ field: 'values.0.id', code: 'not_found' }]);
    expect(valuesOf((await list(agent))[0]!)).toEqual(['S', 'M']);
    await putValues(agent, NO_SUCH, []).expect(404);
  });

  it('удаление свойства: значения снимаются с вариантов, остальные свойства сдвигаются', async () => {
    const agent = await shop('attr-delete@example.com');
    const { body: color } = await create(agent, { name: 'Цвет', values: ['Красный', 'Синий'] }).expect(201);
    const { body: rost } = await create(agent, { name: 'Рост', values: ['104'] }).expect(201);
    const { body: item } = await product(agent, [
      {
        price: 1,
        stock: 1,
        values: [
          { attributeId: color.id, value: 'Красный' },
          { attributeId: rost.id, value: '104' },
        ],
      },
      {
        price: 1,
        stock: 1,
        values: [
          { attributeId: color.id, value: 'Синий' },
          { attributeId: rost.id, value: '104' },
        ],
      },
    ]);
    await agent.delete(`/v1/admin/attributes/${color.id}`).set(XRW).expect(204);
    expect(await list(agent)).toMatchObject([{ id: rost.id, position: 0, values: [{ usageCount: 2 }] }]);
    // варианты совпали — так решено (T-408): повтор покажет таблица размеров при следующем сохранении
    const { body: after } = await agent.get(`/v1/admin/products/${item.id}`).expect(200);
    expect(
      after.variants.map((variant: { values: { value: string }[] }) => variant.values.map((v) => v.value)),
    ).toEqual([['104'], ['104']]);
    await agent.delete(`/v1/admin/attributes/${color.id}`).set(XRW).expect(404);
  });

  it('«Свой размер» из таблицы размеров попадает в конец свойства', async () => {
    const agent = await shop('attr-custom@example.com');
    const { body: rost } = await create(agent, { name: 'Рост', values: ['92'] }).expect(201);
    await product(agent, [
      { price: 1, stock: 1, values: [{ attributeId: rost.id, value: '110' }] },
      { price: 1, stock: 1, values: [{ attributeId: rost.id, value: '92' }] },
    ]);
    expect((await list(agent))[0]!.values.map((value) => [value.value, value.position, value.usageCount])).toEqual([
      ['92', 0, 1],
      ['110', 1, 1],
    ]);
  });

  it('чужой магазин: не видит и не меняет; в таблице размеров чужое свойство — 422', async () => {
    const owner = await shop('attr-owner@example.com');
    const other = await shop('attr-other@example.com');
    const { body: rost } = await create(owner, { name: 'Рост', values: ['92'] }).expect(201);
    expect(await list(other)).toEqual([]);
    await other.patch(`/v1/admin/attributes/${rost.id}`).set(XRW).send({ name: 'Моё' }).expect(404);
    await putValues(other, rost.id, []).expect(404);
    await other.delete(`/v1/admin/attributes/${rost.id}`).set(XRW).expect(404);
    const res = await other
      .post('/v1/admin/products')
      .set(XRW)
      .send({ name: 'Товар', variants: [{ price: 1, stock: 1, values: [{ attributeId: rost.id, value: '92' }] }] })
      .expect(422);
    expect(res.body.errors).toEqual([{ field: 'variants.0.values.0.attributeId', code: 'not_found' }]);
    await other.get('/v1/admin/attributes').expect(200);
    expect(await list(owner)).toEqual([rost]);
  });
});
