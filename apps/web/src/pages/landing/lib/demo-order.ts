/**
 * Интерактивный пример на лендинге (макет N, «два телефона»): покупатель собирает заказ → он «летит» в WhatsApp
 * магазина → магазин отвечает в чате. Остатки не меняются: заказы мы не храним (D14).
 * На телефоне видно один экран: после отправки сам открывается «Ваш WhatsApp».
 */
export type DemoProduct = { name: string; price: number; stock: number; colors: [string, string] };

export const DEMO_PRODUCTS: DemoProduct[] = [
  { name: 'Куртка демисезонная', price: 18900, stock: 1, colors: ['#9C90FF', '#3B2FD9'] },
  { name: 'Платье трикотажное', price: 9500, stock: 5, colors: ['#FFC3DD', '#E2508F'] },
  { name: 'Кроссовки', price: 14200, stock: 2, colors: ['#FFE19A', '#F0A22C'] },
  { name: 'Шапка вязаная', price: 4200, stock: 6, colors: ['#B8FFE1', '#26B985'] },
  { name: 'Худи с капюшоном', price: 8900, stock: 4, colors: ['#C9BBFF', '#7C6CFF'] },
  { name: 'Платье летнее', price: 8200, stock: 3, colors: ['#FFF0A8', '#E3AE00'] },
];

/** shop — покупатель выбирает; flying — заказ летит; sent — пришёл в WhatsApp; answered — магазин ответил. */
export type DemoPhase = 'shop' | 'flying' | 'sent' | 'answered';
export type DemoView = 'buyer' | 'shop';

export type DemoState = {
  /** Сколько штук каждого товара в заказе, по индексу в DEMO_PRODUCTS. */
  cart: number[];
  phase: DemoPhase;
  view: DemoView;
};

export type DemoAction =
  | { type: 'add'; index: number }
  | { type: 'send' }
  | { type: 'arrived' }
  | { type: 'answer' }
  | { type: 'reset' }
  | { type: 'view'; view: DemoView };

/** Сколько летит заказ между телефонами, мс (анимация `animate-fly`). */
export const FLIGHT_MS = 1400;

export const initialDemoState: DemoState = { cart: DEMO_PRODUCTS.map(() => 0), phase: 'shop', view: 'buyer' };

export const canAdd = (state: DemoState, index: number): boolean =>
  state.phase === 'shop' && (state.cart[index] ?? 0) < (DEMO_PRODUCTS[index]?.stock ?? 0);

export const orderCount = (state: DemoState): number => state.cart.reduce((sum, quantity) => sum + quantity, 0);

export const orderTotal = (state: DemoState): number =>
  state.cart.reduce((sum, quantity, index) => sum + quantity * (DEMO_PRODUCTS[index]?.price ?? 0), 0);

/** Строки заказа в сообщении: «1. Куртка демисезонная (110) × 1». */
export const orderLines = (state: DemoState) =>
  DEMO_PRODUCTS.flatMap((product, index) => {
    const quantity = state.cart[index] ?? 0;
    return quantity > 0 ? [{ name: product.name, quantity, sum: quantity * product.price }] : [];
  });

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'add':
      if (!canAdd(state, action.index)) return state;
      return {
        ...state,
        cart: state.cart.map((quantity, index) => (index === action.index ? quantity + 1 : quantity)),
      };
    case 'send':
      return state.phase === 'shop' && orderCount(state) > 0 ? { ...state, phase: 'flying' } : state;
    case 'arrived':
      return state.phase === 'flying' ? { ...state, phase: 'sent', view: 'shop' } : state;
    case 'answer':
      return state.phase === 'sent' ? { ...state, phase: 'answered' } : state;
    case 'reset':
      return initialDemoState;
    case 'view':
      return { ...state, view: action.view };
  }
}
