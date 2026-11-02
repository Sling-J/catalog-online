// Обработчики MSW админки на данных демо-магазина. По умолчанию владелец «Айгерим Kids» уже вошёл и прошёл мастер;
// регистрация открывает сессию нового магазина-черновика, выход — закрывает. Сессию можно хранить между
// перезагрузками страницы (`storage`), иначе она живёт в памяти. Ссылки из писем: токен `expired` — устарела (410),
// любой другой — действует. Мастер (T-303): название, адрес и WhatsApp помнятся в сессии, логотип — только в памяти
// (картинка в хранилище браузера не влезает); адреса `aigerim-kids` и `skrytyj-magazin` заняты, служебные —
// зарезервированы. Публикация (T-304): снятие переводит демо-магазин в черновик — так видна главная с чек-листом;
// опубликовать можно, когда есть товары и почта подтверждена (иначе 409 `shop_not_ready`).
// Остальные разделы добавляются со своими экранами.
import { delay, http, HttpResponse, type HttpHandler } from 'msw';

import {
  handleChangePassword,
  handleCheckSubdomain,
  handleCreateUpload,
  handleDeleteShopLogo,
  handleForgotPassword,
  handleGetMe,
  handleGetProductCounts,
  handleGetShop,
  handleLogin,
  handleLogout,
  handlePublishShop,
  handleUnpublishShop,
  handleRegister,
  handleResendVerificationEmail,
  handleResetPassword,
  handleSetShopLogo,
  handleUpdateShop,
  handleVerifyEmail,
  type RequestHandlerOptions,
} from '../gen/msw.gen.js';
import type { Image, Me, Problem, Shop } from '../gen/types.gen.js';
import { createDemoShopData, demoShop, HIDDEN_DEMO_SUBDOMAIN } from './demo-shop.js';

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

/** Что новый магазин успел заполнить в мастере. */
type NewShopFields = { name?: string; subdomain?: string; whatsapp?: string; setupCompleted?: boolean };

/** Сессия на моках: демо-владелец, только что зарегистрированный магазин или никто. */
type Session =
  | { kind: 'demo'; draft?: boolean }
  | { kind: 'new'; email: string; password: string; verified?: boolean; shop?: NewShopFields }
  | { kind: 'out' };

const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
const TAKEN_SUBDOMAINS = [demoShop.subdomain, HIDDEN_DEMO_SUBDOMAIN];
// служебные имена (FR-A2): в API список будет полнее
const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'admin', 'mail', 'static', 'cdn', 'help', 'support'];
const UPLOAD_ORIGIN = 'https://uploads.mock';

const subdomainProblem = (value: string): 'invalid' | 'reserved' | 'taken' | null => {
  if (!SUBDOMAIN_PATTERN.test(value)) return 'invalid';
  if (RESERVED_SUBDOMAINS.includes(value)) return 'reserved';
  if (TAKEN_SUBDOMAINS.includes(value)) return 'taken';
  return null;
};

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

/** Демо-магазин в сессии: опубликован или снят с публикации. */
const demoShopOf = (session: Extract<Session, { kind: 'demo' }>): Shop =>
  session.draft ? { ...demoAdminShop, status: 'draft', publishedAt: null } : demoAdminShop;

const meOf = (session: Exclude<Session, { kind: 'out' }>): Me =>
  session.kind === 'demo'
    ? { ...demoMe, shop: { ...demoMe.shop, status: session.draft ? 'draft' : 'published' } }
    : {
        account: {
          id: NEW_ACCOUNT_ID,
          email: session.email,
          emailVerified: session.verified ?? false,
          impersonated: false,
        },
        shop: {
          id: NEW_SHOP_ID,
          name: session.shop?.name ?? null,
          subdomain: session.shop?.subdomain ?? null,
          status: 'draft',
          setupCompleted: session.shop?.setupCompleted ?? false,
        },
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
  // загруженные файлы и логотип нового магазина — data: URL в памяти
  const uploads = new Map<string, string>();
  let logo: Image | null = null;
  const shopOf = (session: Extract<Session, { kind: 'new' }>): Shop => ({
    ...newShop,
    name: session.shop?.name ?? null,
    subdomain: session.shop?.subdomain ?? null,
    whatsapp: session.shop?.whatsapp ?? null,
    logo,
  });

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
      return HttpResponse.json(session.kind === 'demo' ? demoShopOf(session) : shopOf(session));
    }, options),
    handleUpdateShop(async ({ request }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const body = await request.json();
      if (body.subdomain !== undefined) {
        const reason = subdomainProblem(body.subdomain);
        if (reason === 'invalid')
          return problem(422, 'validation_failed', { errors: [{ field: 'subdomain', code: 'invalid_format' }] });
        if (reason) return problem(409, reason === 'taken' ? 'subdomain_taken' : 'subdomain_reserved');
      }
      if (body.whatsapp !== undefined && !/^\+7\d{10}$/.test(body.whatsapp)) {
        return problem(422, 'validation_failed', { errors: [{ field: 'whatsapp', code: 'invalid_format' }] });
      }
      // демо-магазин настроен заранее: правки не сохраняем
      if (session.kind === 'demo') return HttpResponse.json({ ...demoShopOf(session), ...body });
      // только переданные поля (PATCH)
      const { name, subdomain, whatsapp, setupCompleted } = body;
      const changes = Object.fromEntries(
        Object.entries({ name, subdomain, whatsapp, setupCompleted }).filter(([, value]) => value !== undefined),
      ) as NewShopFields;
      const next = { ...session, shop: { ...session.shop, ...changes } };
      write(next);
      return HttpResponse.json(shopOf(next));
    }, options),
    handleCheckSubdomain(async ({ request }) => {
      // небольшая пауза — чтобы в мастере было видно «Проверяем…»
      await delay(400);
      const value = new URL(request.url).searchParams.get('value') ?? '';
      const session = read();
      const own = session.kind === 'new' && session.shop?.subdomain === value;
      const reason = own ? null : subdomainProblem(value);
      return HttpResponse.json({ available: reason === null, reason });
    }, options),
    handleCreateUpload(async () => {
      const uploadId = crypto.randomUUID();
      return HttpResponse.json(
        {
          uploadId,
          url: `${UPLOAD_ORIGIN}/${uploadId}`,
          method: 'PUT' as const,
          headers: {},
          expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
        },
        { status: 201 },
      );
    }, options),
    // «хранилище»: файл приходит PUT по ссылке из createUpload
    http.put(`${UPLOAD_ORIGIN}/:uploadId`, async ({ request, params }) => {
      const type = request.headers.get('Content-Type') ?? 'application/octet-stream';
      const bytes = new Uint8Array(await request.arrayBuffer());
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      uploads.set(String(params.uploadId), `data:${type};base64,${btoa(binary)}`);
      return new HttpResponse(null, { status: 200 });
    }),
    handleSetShopLogo(async ({ request }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const { uploadId } = await request.json();
      const url = uploads.get(uploadId);
      if (!url) return problem(422, 'upload_not_found');
      const image: Image = { width: 400, height: 400, sizes: { '320': url, '640': url, '1280': url } };
      if (session.kind === 'demo') return HttpResponse.json({ ...demoShopOf(session), logo: image });
      logo = image;
      return HttpResponse.json(shopOf(session));
    }, options),
    handleDeleteShopLogo(() => {
      logo = null;
      return new HttpResponse(null, { status: 204 });
    }, options),
    handlePublishShop(() => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      // у нового магазина на моках товаров нет — опубликовать нельзя
      if (session.kind === 'new') return problem(409, 'shop_not_ready');
      const next = { kind: 'demo' as const, draft: false };
      write(next);
      return HttpResponse.json(demoShopOf(next));
    }, options),
    handleUnpublishShop(() => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      if (session.kind === 'new') return HttpResponse.json(shopOf(session));
      const next = { kind: 'demo' as const, draft: true };
      write(next);
      return HttpResponse.json(demoShopOf(next));
    }, options),
    handleGetProductCounts(() => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      return HttpResponse.json(session.kind === 'demo' ? counts : { all: 0, noPhoto: 0, outOfStock: 0, hidden: 0 });
    }, options),
  ];
};
