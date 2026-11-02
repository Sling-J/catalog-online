// Обработчики MSW админки на данных демо-магазина. По умолчанию владелец «Айгерим Kids» уже вошёл и прошёл мастер;
// регистрация открывает сессию нового магазина-черновика, выход — закрывает. Сессию можно хранить между
// перезагрузками страницы (`storage`), иначе она живёт в памяти. Ссылки из писем: токен `expired` — устарела (410),
// любой другой — действует. Остальные разделы добавляются со своими экранами.
import { HttpResponse, type HttpHandler } from 'msw';

import {
  handleChangePassword,
  handleForgotPassword,
  handleGetMe,
  handleGetProductCounts,
  handleGetShop,
  handleLogin,
  handleLogout,
  handleRegister,
  handleResendVerificationEmail,
  handleResetPassword,
  handleVerifyEmail,
  type RequestHandlerOptions,
} from '../gen/msw.gen.js';
import type { Me, Problem, Shop } from '../gen/types.gen.js';
import { createDemoShopData, demoShop } from './demo-shop.js';

const SHOP_ID = '0192d000-0000-7000-8000-00000000a001';
const NEW_SHOP_ID = '0192d000-0000-7000-8000-00000000a002';
const NEW_ACCOUNT_ID = '0192d000-0000-7000-8000-00000000b002';

/** Пароль демо-владельца для входа на моках. */
export const DEMO_ADMIN_PASSWORD = 'demo-password';
/** Токен ссылки из письма, который моки считают устаревшим (410). */
export const EXPIRED_EMAIL_TOKEN = 'expired';
const MIN_PASSWORD = 8;

const { products } = createDemoShopData();

const counts = {
  all: products.length,
  noPhoto: products.filter((product) => product.photos.length === 0).length,
  outOfStock: products.filter((product) => product.variants.every((variant) => variant.stock.level === 'out')).length,
  hidden: 0,
};

export const demoMe: Me = {
  account: {
    id: '0192d000-0000-7000-8000-00000000b001',
    email: 'aigerim.kids@example.com',
    emailVerified: true,
    impersonated: false,
  },
  shop: { id: SHOP_ID, name: demoShop.name, subdomain: demoShop.subdomain, status: 'published', setupCompleted: true },
};

const {
  subdomain,
  name,
  logo,
  description,
  whatsapp,
  instagram,
  address,
  howToFind,
  schedule,
  timezone,
  stockDisplay,
} = demoShop;

export const demoAdminShop: Shop = {
  id: SHOP_ID,
  status: 'published',
  subdomain,
  name,
  logo,
  description,
  whatsapp,
  instagram,
  address,
  howToFind,
  schedule,
  timezone,
  stockDisplay,
  lowStockThreshold: 2,
  showOutOfStock: true,
  publishedAt: '2026-10-20T09:00:00Z',
  readiness: {
    settingsFilled: true,
    productCount: counts.all,
    productsWithoutPhoto: counts.noPhoto,
    canPublish: true,
  },
};

// Магазин-черновик сразу после регистрации: мастер не пройден, товаров нет (FR-A2).
const newShop: Shop = {
  id: NEW_SHOP_ID,
  status: 'draft',
  subdomain: null,
  name: null,
  logo: null,
  description: null,
  whatsapp: null,
  instagram: null,
  address: null,
  howToFind: null,
  schedule: { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null },
  timezone: 'Asia/Almaty',
  stockDisplay: 'levels',
  lowStockThreshold: 2,
  showOutOfStock: true,
  publishedAt: null,
  readiness: { settingsFilled: false, productCount: 0, productsWithoutPhoto: 0, canPublish: false },
};

/** Сессия на моках: демо-владелец, только что зарегистрированный магазин или никто. */
type Session =
  { kind: 'demo' } | { kind: 'new'; email: string; password: string; verified?: boolean } | { kind: 'out' };

export type DemoAdminStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type DemoAdminHandlersOptions = RequestHandlerOptions & {
  /** Где помнить сессию между перезагрузками (в браузере — `localStorage`). */
  storage?: DemoAdminStorage;
};

const SESSION_KEY = 'catalog-admin-mock-session';

const problem = (status: number, code: string, extra: Partial<Problem> = {}): Response =>
  HttpResponse.json<Problem>(
    { type: 'about:blank', title: code, status, code, ...extra },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );

const tooShort = (field: string): Response =>
  problem(422, 'validation_failed', { errors: [{ field, code: 'too_short', params: { min: MIN_PASSWORD } }] });
const gone = (): Response => problem(410, 'token_expired');

const meOf = (session: Exclude<Session, { kind: 'out' }>): Me =>
  session.kind === 'demo'
    ? demoMe
    : {
        account: {
          id: NEW_ACCOUNT_ID,
          email: session.email,
          emailVerified: session.verified ?? false,
          impersonated: false,
        },
        shop: { id: NEW_SHOP_ID, name: null, subdomain: null, status: 'draft', setupCompleted: false },
      };

export const demoAdminHandlers = ({ storage, ...options }: DemoAdminHandlersOptions = {}): HttpHandler[] => {
  let memory: Session = { kind: 'demo' };
  const read = (): Session => {
    const saved = storage?.getItem(SESSION_KEY);
    return saved ? (JSON.parse(saved) as Session) : memory;
  };
  const write = (session: Session): void => {
    memory = session;
    storage?.setItem(SESSION_KEY, JSON.stringify(session));
  };

  return [
    handleRegister(async ({ request }) => {
      const { email, password } = await request.json();
      if (password.length < MIN_PASSWORD) return tooShort('password');
      if (email.trim().toLowerCase() === demoMe.account.email) return problem(409, 'email_taken');
      const session: Session = { kind: 'new', email: email.trim(), password };
      write(session);
      return HttpResponse.json(meOf(session), { status: 201 });
    }, options),
    handleLogin(async ({ request }) => {
      const { email, password } = await request.json();
      if (email.trim().toLowerCase() !== demoMe.account.email || password !== DEMO_ADMIN_PASSWORD) {
        return problem(401, 'unauthorized');
      }
      write({ kind: 'demo' });
      return HttpResponse.json(demoMe);
    }, options),
    handleLogout(() => {
      write({ kind: 'out' });
      return new HttpResponse(null, { status: 204 });
    }, options),
    handleVerifyEmail(async ({ request }) => {
      const { token } = await request.json();
      if (token === EXPIRED_EMAIL_TOKEN) return gone();
      const session = read();
      if (session.kind === 'new') write({ ...session, verified: true });
      return new HttpResponse(null, { status: 204 });
    }, options),
    handleResendVerificationEmail(
      () => (read().kind === 'out' ? problem(401, 'unauthorized') : new HttpResponse(null, { status: 204 })),
      options,
    ),
    // ответ одинаковый, есть такой аккаунт или нет
    handleForgotPassword(() => new HttpResponse(null, { status: 204 }), options),
    handleResetPassword(async ({ request }) => {
      const { token, password } = await request.json();
      if (token === EXPIRED_EMAIL_TOKEN) return gone();
      if (password.length < MIN_PASSWORD) return tooShort('password');
      // пароль изменён — все сессии закрыты
      write({ kind: 'out' });
      return new HttpResponse(null, { status: 204 });
    }, options),
    handleChangePassword(async ({ request }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const { currentPassword, newPassword } = await request.json();
      const current = session.kind === 'demo' ? DEMO_ADMIN_PASSWORD : session.password;
      if (currentPassword !== current) return problem(401, 'unauthorized');
      if (newPassword.length < MIN_PASSWORD) return tooShort('newPassword');
      // демо-пароль постоянный, чтобы вход на моках не ломался
      if (session.kind === 'new') write({ ...session, password: newPassword });
      return new HttpResponse(null, { status: 204 });
    }, options),
    handleGetMe(() => {
      const session = read();
      return session.kind === 'out' ? problem(401, 'unauthorized') : HttpResponse.json(meOf(session));
    }, options),
    handleGetShop(() => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      return HttpResponse.json(session.kind === 'demo' ? demoAdminShop : newShop);
    }, options),
    handleGetProductCounts(() => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      return HttpResponse.json(session.kind === 'demo' ? counts : { all: 0, noPhoto: 0, outOfStock: 0, hidden: 0 });
    }, options),
  ];
};
