import { describe, expect, it } from 'vitest';

import { canAdd, demoReducer, initialDemoState, orderCount, orderLines, orderTotal } from '../demo-order';

describe('пример заказа на лендинге', () => {
  it('нельзя положить больше, чем есть в наличии', () => {
    let state = demoReducer(initialDemoState, { type: 'add', index: 0 });
    expect(canAdd(state, 0)).toBe(false);
    state = demoReducer(state, { type: 'add', index: 0 });
    expect(state.cart[0]).toBe(1);
  });

  it('заказ уходит, приходит в WhatsApp магазина (на телефоне открывается его экран) и получает ответ', () => {
    let state = demoReducer(initialDemoState, { type: 'send' });
    expect(state.phase).toBe('shop');

    state = demoReducer(state, { type: 'add', index: 1 });
    state = demoReducer(state, { type: 'add', index: 1 });
    state = demoReducer(state, { type: 'add', index: 3 });
    expect(orderCount(state)).toBe(3);
    expect(orderTotal(state)).toBe(2 * 9500 + 4200);
    expect(orderLines(state)).toEqual([
      { name: 'Платье трикотажное', quantity: 2, sum: 19000 },
      { name: 'Шапка вязаная', quantity: 1, sum: 4200 },
    ]);

    state = demoReducer(state, { type: 'send' });
    expect(state.phase).toBe('flying');
    expect(canAdd(state, 1)).toBe(false);
    state = demoReducer(state, { type: 'arrived' });
    expect(state).toMatchObject({ phase: 'sent', view: 'shop' });
    state = demoReducer(state, { type: 'answer' });
    expect(state.phase).toBe('answered');

    expect(demoReducer(state, { type: 'reset' })).toEqual(initialDemoState);
  });
});
