// Обработчики MSW админки на данных демо-магазина. По умолчанию владелец «Айгерим Kids» уже вошёл и прошёл мастер;
// регистрация открывает сессию нового магазина-черновика, выход — закрывает. Сессию можно хранить между
// перезагрузками страницы (`storage`), иначе она живёт в памяти. Ссылки из писем: токен `expired` — устарела (410),
// любой другой — действует. Мастер (T-303): название, адрес и WhatsApp помнятся в сессии, логотип — только в памяти
// (картинка в хранилище браузера не влезает); адреса `aigerim-kids` и `skrytyj-magazin` заняты, служебные —
// зарезервированы. Публикация (T-304): снятие переводит демо-магазин в черновик — так видна главная с чек-листом;
// опубликовать можно, когда есть товары и почта подтверждена (иначе 409 `shop_not_ready`). Товары (T-305): список
// с поиском, вкладками, категорией и сортировкой, «Витрина» у товара и массовые действия; правки живут в памяти.
// Редактор (T-306): товар, таблица размеров целиком, новый товар вручную, удаление, свойства; «Свой размер» добавляет
// значение.
// Фото (T-307): прикрепить загруженное (в новом товаре — сразу при создании), порядок, удаление; сжатие изображается
// паузой — фото сначала `processing`, через пару секунд `ready`. Не больше 10 фото у товара (409 `photo_limit_reached`).
// Импорт (T-309): сценарий — по имени файла, шаги идут по времени (подробно — admin-imports.ts).
// Раздел «Магазин» (T-310): правки «О магазине», настройки наличия (T-312) и логотип демо-магазина живут, пока открыта
// страница (у нового магазина — в сессии); порог «мало» — от 1 до 50 (иначе 422); токен превью —
// любой (витрина на моках принимает любой); статистика — admin-stats.ts.
// Категории и свойства (T-311): создать, переименовать, порядок и вложенность, удалить; правки живут в памяти
// (подробно — admin-catalog.ts).
// Остальные разделы добавляются со своими экранами.
import { delay, http, HttpResponse, type HttpHandler } from 'msw';

import {
  handleApplyImport,
  handleCancelImport,
  handleCreateImport,
  handleCreatePreviewToken,
  handleGetStats,
  handleDownloadImportTemplate,
  handleGetImport,
  handleListImportErrors,
  handleListImports,
  handleSetImportMapping,
  handleChangePassword,
  handleCheckSubdomain,
  handleAddProductPhoto,
  handleCreateUpload,
  handleDeleteShopLogo,
  handleForgotPassword,
  handleBulkUpdateProducts,
  handleCreateProduct,
  handleDeleteProduct,
  handleDeleteProductPhoto,
  handleGetMe,
  handleGetProduct,
  handleGetProductCounts,
  handleGetShop,
  handleCreateAttribute,
  handleCreateCategory,
  handleDeleteAttribute,
  handleDeleteCategory,
  handleListAttributes,
  handleListCategories,
  handleRenameCategory,
  handleReorderCategories,
  handleReplaceAttributeValues,
  handleUpdateAttribute,
  handleListProducts,
  handleLogin,
  handleLogout,
  handlePublishShop,
  handleUnpublishShop,
  handleRegister,
  handleReorderProductPhotos,
  handleReplaceProductVariants,
  handleResendVerificationEmail,
  handleResetPassword,
  handleSetShopLogo,
  handleUpdateProduct,
  handleUpdateShop,
  handleVerifyEmail,
  type RequestHandlerOptions,
} from '../gen/msw.gen.js';
import type { Attribute, Image, Me, Photo, Problem, Product, Shop } from '../gen/types.gen.js';
import {
  type AdminFilter,
  type AdminSort,
  applyVariantInputs,
  countProducts,
  createAdminProduct,
  createDemoAdminAttributes,
  createDemoAdminProducts,
  selectAdminProducts,
  toListItem,
} from './admin-products.js';
import {
  type CatalogOutcome,
  type CategoryRecord,
  categoryTree,
  createAttribute,
  createCategory,
  deleteAttribute,
  deleteCategory,
  demoCategoryRecords,
  flatCategories,
  renameCategory,
  reorderCategories,
  replaceAttributeValues,
  updateAttribute,
  withUsage,
} from './admin-catalog.js';
import { createImportStore, importTemplateXlsx, mappingProblem } from './admin-imports.js';
import { demoStats, emptyStats, type StatsPeriod } from './admin-stats.js';
import {
  DEMO_ACCOUNT_ID,
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  DEMO_SHOP_ID,
  demoShopSettings,
} from './demo-admin.js';
import { demoShop, HIDDEN_DEMO_SUBDOMAIN } from './demo-shop.js';

const SHOP_ID = DEMO_SHOP_ID;
const NEW_SHOP_ID = '0192d000-0000-7000-8000-00000000a002';
const NEW_ACCOUNT_ID = '0192d000-0000-7000-8000-00000000b002';

export { DEMO_ADMIN_PASSWORD };
/** Токен ссылки из письма, который моки считают устаревшим (410). */
export const EXPIRED_EMAIL_TOKEN = 'expired';
const MIN_PASSWORD = 8;

const counts = countProducts(createDemoAdminProducts());
const PAGE_SIZE = 30;

export const demoMe: Me = {
  account: {
    id: DEMO_ACCOUNT_ID,
    email: DEMO_ADMIN_EMAIL,
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
  ...demoShopSettings,
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

/** Что новый магазин успел заполнить в мастере и в «О магазине». */
type NewShopFields = {
  name?: string;
  subdomain?: string;
  whatsapp?: string;
  setupCompleted?: boolean;
} & Partial<
  Pick<
    Shop,
    | 'description'
    | 'instagram'
    | 'address'
    | 'howToFind'
    | 'schedule'
    | 'stockDisplay'
    | 'lowStockThreshold'
    | 'showOutOfStock'
  >
>;

/** Поля «О магазине», которые моки запоминают из `PATCH /shop`. */
const SETTINGS_FIELDS = [
  'name',
  'description',
  'whatsapp',
  'instagram',
  'address',
  'howToFind',
  'schedule',
  'stockDisplay',
  'lowStockThreshold',
  'showOutOfStock',
] as const;

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
const PHOTO_LIMIT = 10;
// «сжатие» фото на моках
const PHOTO_PROCESSING_MS = 2500;

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
  /** Откуда приложение отдаёт фото (`<assetBase>/demo/<имя>.jpg`). Пустая строка — адреса от корня страницы. */
  assetBase?: string;
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

/** Демо-магазин в сессии: опубликован или снят с публикации; поверх — правки «О магазине». */
const demoShopOf = (session: Extract<Session, { kind: 'demo' }>, edits: Partial<Shop> = {}): Shop => ({
  ...(session.draft ? { ...demoAdminShop, status: 'draft', publishedAt: null } : demoAdminShop),
  ...edits,
});

const meOf = (session: Exclude<Session, { kind: 'out' }>, edits: Partial<Shop> = {}): Me =>
  session.kind === 'demo'
    ? {
        ...demoMe,
        shop: { ...demoMe.shop, name: edits.name ?? demoMe.shop.name, status: session.draft ? 'draft' : 'published' },
      }
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

export const demoAdminHandlers = ({ storage, assetBase, ...options }: DemoAdminHandlersOptions = {}): HttpHandler[] => {
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
  // имена загруженных файлов — по ним моки выбирают сценарий импорта
  const uploadNames = new Map<string, string>();
  let logo: Image | null = null;
  // правки «О магазине» и логотип демо-магазина
  let demoEdits: Partial<Shop> = {};
  const demoShopIn = (session: Extract<Session, { kind: 'demo' }>): Shop => demoShopOf(session, demoEdits);
  // импорты: у демо-магазина есть история, у нового — нет
  const demoImports = createImportStore(true);
  const newImports = createImportStore(false);
  const importsOf = (session: Exclude<Session, { kind: 'out' }>) =>
    session.kind === 'demo' ? demoImports : newImports;
  // товары и свойства: правки из списка и редактора живут, пока открыта страница; у нового магазина — пусто
  let demoProducts: Product[] | null = null;
  let demoAttributes: Attribute[] | null = null;
  const newProducts: Product[] = [];
  const newAttributes: Attribute[] = [];
  const productsOf = (session: Session, request: Request): Product[] => {
    if (session.kind !== 'demo') return newProducts;
    demoProducts ??= createDemoAdminProducts(assetBase ?? globalThis.location?.origin ?? new URL(request.url).origin);
    return demoProducts;
  };
  const attributesOf = (session: Session, request: Request): Attribute[] => {
    if (session.kind !== 'demo') return newAttributes;
    demoAttributes ??= createDemoAdminAttributes(productsOf(session, request));
    return demoAttributes;
  };
  // категории: у демо-магазина — из витрины, у нового — пусто
  let demoCategoryList: CategoryRecord[] | null = null;
  const newCategories: CategoryRecord[] = [];
  const categoriesOf = (session: Session): CategoryRecord[] => {
    if (session.kind !== 'demo') return newCategories;
    demoCategoryList ??= demoCategoryRecords();
    return demoCategoryList;
  };
  const treeOf = (session: Session, request: Request) =>
    categoryTree(categoriesOf(session), productsOf(session, request));
  const findProduct = (session: Session, request: Request, productId: unknown) => {
    const products = productsOf(session, request);
    return { products, index: products.findIndex((item) => item.id === productId) };
  };
  // фото встаёт в очередь «сжатия»: через паузу у него появляется картинка (если его ещё не удалили)
  const processPhoto = (products: Product[], productId: string, photoId: string, url: string): void => {
    setTimeout(() => {
      const index = products.findIndex((item) => item.id === productId);
      const product = products[index];
      if (!product) return;
      const image: Image = { width: 1280, height: 1280, sizes: { '320': url, '640': url, '1280': url } };
      products[index] = {
        ...product,
        photos: product.photos.map((photo) => (photo.id === photoId ? { ...photo, status: 'ready', image } : photo)),
      };
    }, PHOTO_PROCESSING_MS);
  };
  const newPhoto = (position: number): Photo => ({
    id: crypto.randomUUID(),
    position,
    status: 'processing',
    image: null,
  });
  // ответ на правку категорий и свойств: не нашли — 404, повтор имени — 409 с кодом, остальное — 422
  const outcomeProblem = (outcome: CatalogOutcome<unknown> | 'in_use', conflictCode: string): Response | null => {
    if (outcome === 'not_found') return problem(404, 'not_found');
    if (outcome === 'conflict') return problem(409, conflictCode);
    if (outcome === 'in_use') return problem(409, 'attribute_value_in_use');
    if (outcome === 'invalid') return problem(422, 'validation_failed');
    return null;
  };
  const invalidVariants = () =>
    problem(422, 'validation_failed', { errors: [{ field: 'variants', code: 'unknown_attribute' }] });
  const shopOf = (session: Extract<Session, { kind: 'new' }>): Shop => ({
    ...newShop,
    ...session.shop,
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
      return session.kind === 'out' ? problem(401, 'unauthorized') : HttpResponse.json(meOf(session, demoEdits));
    }, options),
    handleGetShop(() => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      return HttpResponse.json(session.kind === 'demo' ? demoShopIn(session) : shopOf(session));
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
      const threshold = body.lowStockThreshold;
      if (threshold !== undefined && (!Number.isInteger(threshold) || threshold < 1 || threshold > 50)) {
        return problem(422, 'validation_failed', { errors: [{ field: 'lowStockThreshold', code: 'out_of_range' }] });
      }
      if (body.whatsapp !== undefined && !/^\+7\d{10}$/.test(body.whatsapp)) {
        return problem(422, 'validation_failed', { errors: [{ field: 'whatsapp', code: 'invalid_format' }] });
      }
      // только переданные поля (PATCH); адрес витрины демо-магазина не меняется
      const settings = Object.fromEntries(
        SETTINGS_FIELDS.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]),
      ) as Partial<Shop>;
      if (session.kind === 'demo') {
        demoEdits = { ...demoEdits, ...settings };
        return HttpResponse.json(demoShopIn(session));
      }
      const { subdomain, setupCompleted } = body;
      const changes = {
        ...settings,
        ...Object.fromEntries(Object.entries({ subdomain, setupCompleted }).filter(([, value]) => value !== undefined)),
      } as NewShopFields;
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
    handleCreateUpload(async ({ request }) => {
      const uploadId = crypto.randomUUID();
      uploadNames.set(uploadId, (await request.json()).fileName);
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
      if (session.kind === 'demo') {
        demoEdits = { ...demoEdits, logo: image };
        return HttpResponse.json(demoShopIn(session));
      }
      logo = image;
      return HttpResponse.json(shopOf(session));
    }, options),
    handleDeleteShopLogo(() => {
      logo = null;
      demoEdits = { ...demoEdits, logo: null };
      return new HttpResponse(null, { status: 204 });
    }, options),
    handlePublishShop(() => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      // у нового магазина на моках товаров нет — опубликовать нельзя
      if (session.kind === 'new') return problem(409, 'shop_not_ready');
      const next = { kind: 'demo' as const, draft: false };
      write(next);
      return HttpResponse.json(demoShopIn(next));
    }, options),
    handleUnpublishShop(() => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      if (session.kind === 'new') return HttpResponse.json(shopOf(session));
      const next = { kind: 'demo' as const, draft: true };
      write(next);
      return HttpResponse.json(demoShopIn(next));
    }, options),
    // токен превью витрины (A7): витрина на моках принимает любой
    handleCreatePreviewToken(() => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      return HttpResponse.json(
        { token: 'demo', expiresAt: new Date(Date.now() + 30 * 60_000).toISOString() },
        { status: 201 },
      );
    }, options),
    // статистика (T-313): неизменные примеры за 7 и 30 дней и за всё время; пауза — чтобы была видна загрузка
    handleGetStats(async ({ request }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      await delay(300);
      const value = new URL(request.url).searchParams.get('period') ?? '7d';
      const period: StatsPeriod = value === '30d' || value === 'all' ? value : '7d';
      return HttpResponse.json(
        session.kind === 'demo' ? demoStats(period, productsOf(session, request)) : emptyStats(period),
      );
    }, options),
    handleGetProductCounts(({ request }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      return HttpResponse.json(countProducts(productsOf(session, request)));
    }, options),
    handleListProducts(async ({ request }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      // небольшая пауза — чтобы было видно загрузку
      await delay(300);
      const query = new URL(request.url).searchParams;
      const products = productsOf(session, request);
      const found = selectAdminProducts(products, {
        q: query.get('q') ?? undefined,
        categoryId: query.get('categoryId') ?? undefined,
        filter: (query.get('filter') as AdminFilter | null) ?? undefined,
        sort: (query.get('sort') as AdminSort | null) ?? undefined,
      });
      const offset = Number(query.get('cursor') ?? 0) || 0;
      const limit = Number(query.get('limit') ?? PAGE_SIZE) || PAGE_SIZE;
      const categories = flatCategories(treeOf(session, request));
      return HttpResponse.json({
        items: found.slice(offset, offset + limit).map((product) => toListItem(product, categories)),
        nextCursor: offset + limit < found.length ? String(offset + limit) : null,
        total: found.length,
      });
    }, options),
    handleListCategories(({ request }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      return HttpResponse.json(treeOf(session, request));
    }, options),
    handleCreateCategory(async ({ request }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const { name, parentId } = await request.json();
      const outcome = createCategory(categoriesOf(session), name, parentId ?? null);
      const failed = outcomeProblem(outcome, 'category_name_taken');
      if (failed) return failed;
      const created = flatCategories(treeOf(session, request)).find(
        (item) => item.id === (outcome as CategoryRecord).id,
      );
      return HttpResponse.json(created, { status: 201 });
    }, options),
    handleReorderCategories(async ({ request }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const { items } = await request.json();
      const outcome = reorderCategories(categoriesOf(session), items);
      // повтор имени среди новых соседей — тоже 422: порядок пришёл неверный
      if (typeof outcome === 'string') return problem(422, 'validation_failed');
      return HttpResponse.json(treeOf(session, request));
    }, options),
    handleRenameCategory(async ({ request, params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const { name } = await request.json();
      const outcome = renameCategory(categoriesOf(session), String(params.categoryId), name);
      const failed = outcomeProblem(outcome, 'category_name_taken');
      if (failed) return failed;
      return HttpResponse.json(flatCategories(treeOf(session, request)).find((item) => item.id === params.categoryId));
    }, options),
    handleDeleteCategory(({ request, params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const outcome = deleteCategory(categoriesOf(session), productsOf(session, request), String(params.categoryId));
      if (outcome === 'not_found') return problem(404, 'not_found');
      if (outcome === 'has_children') return problem(409, 'category_has_children');
      return new HttpResponse(null, { status: 204 });
    }, options),
    handleGetProduct(({ request, params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const product = productsOf(session, request).find((item) => item.id === params.productId);
      return product ? HttpResponse.json(product) : problem(404, 'not_found');
    }, options),
    handleUpdateProduct(async ({ request, params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const products = productsOf(session, request);
      const index = products.findIndex((item) => item.id === params.productId);
      if (index < 0) return problem(404, 'not_found');
      const body = await request.json();
      const changes = Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined));
      const before = products[index]!;
      // название или категория, изменённые руками, теряют пометку «из Excel» — импорт их больше не перезапишет;
      // `importedFields` в запросе («Брать из Excel») ставит пометки на этих двух полях ровно как передано (T-409)
      const fields = new Set(before.importedFields);
      if (body.importedFields) {
        for (const field of ['name', 'category'] as const) {
          if (body.importedFields.includes(field)) fields.add(field);
          else fields.delete(field);
        }
      } else {
        if (body.name !== undefined && body.name !== before.name) fields.delete('name');
        if (body.categoryId !== undefined && body.categoryId !== before.categoryId) fields.delete('category');
      }
      products[index] = {
        ...before,
        ...changes,
        importedFields: (['name', 'category', 'variants'] as const).filter((field) => fields.has(field)),
        updatedAt: new Date().toISOString(),
      };
      return HttpResponse.json(products[index]);
    }, options),
    handleCreateProduct(async ({ request }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const body = await request.json();
      if (!body.name.trim())
        return problem(422, 'validation_failed', { errors: [{ field: 'name', code: 'required' }] });
      const variants = applyVariantInputs(body.variants, [], attributesOf(session, request), 'TV');
      if (!variants) return invalidVariants();
      const uploadIds = body.photoUploadIds ?? [];
      if (uploadIds.length > PHOTO_LIMIT) return problem(409, 'photo_limit_reached');
      if (uploadIds.some((uploadId) => !uploads.has(uploadId))) return problem(422, 'upload_not_found');
      const photos = uploadIds.map((_, position) => newPhoto(position));
      const product = { ...createAdminProduct(body, variants), photos };
      // «сначала новые»: новый товар — первым в списке
      const products = productsOf(session, request);
      products.unshift(product);
      photos.forEach((photo, index) => processPhoto(products, product.id, photo.id, uploads.get(uploadIds[index]!)!));
      return HttpResponse.json(product, { status: 201 });
    }, options),
    handleDeleteProduct(({ request, params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const products = productsOf(session, request);
      const index = products.findIndex((item) => item.id === params.productId);
      if (index < 0) return problem(404, 'not_found');
      products.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }, options),
    handleReplaceProductVariants(async ({ request, params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const products = productsOf(session, request);
      const index = products.findIndex((item) => item.id === params.productId);
      if (index < 0) return problem(404, 'not_found');
      const product = products[index]!;
      const { variants: inputs } = await request.json();
      const prefix = product.variants[0]?.sku.split('-')[0] ?? 'TV';
      const variants = applyVariantInputs(inputs, product.variants, attributesOf(session, request), prefix);
      if (!variants) return invalidVariants();
      products[index] = { ...product, variants, updatedAt: new Date().toISOString() };
      return HttpResponse.json(products[index]);
    }, options),
    handleAddProductPhoto(async ({ request, params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const { products, index } = findProduct(session, request, params.productId);
      const product = products[index];
      if (!product) return problem(404, 'not_found');
      if (product.photos.length >= PHOTO_LIMIT) return problem(409, 'photo_limit_reached');
      const { uploadId } = await request.json();
      const url = uploads.get(uploadId);
      if (!url) return problem(422, 'upload_not_found');
      const photo = newPhoto(product.photos.length);
      products[index] = { ...product, photos: [...product.photos, photo], updatedAt: new Date().toISOString() };
      processPhoto(products, product.id, photo.id, url);
      return HttpResponse.json(photo, { status: 201 });
    }, options),
    handleReorderProductPhotos(async ({ request, params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const { products, index } = findProduct(session, request, params.productId);
      const product = products[index];
      if (!product) return problem(404, 'not_found');
      const { photoIds } = await request.json();
      const byId = new Map(product.photos.map((photo) => [photo.id, photo]));
      // список должен быть ровно теми же фото, без повторов
      if (photoIds.length !== byId.size || new Set(photoIds).size !== byId.size || photoIds.some((id) => !byId.has(id)))
        return problem(422, 'validation_failed', { errors: [{ field: 'photoIds', code: 'invalid' }] });
      const photos = photoIds.map((id, position) => ({ ...byId.get(id)!, position }));
      products[index] = { ...product, photos, updatedAt: new Date().toISOString() };
      return HttpResponse.json(photos);
    }, options),
    handleDeleteProductPhoto(({ request, params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const { products, index } = findProduct(session, request, params.productId);
      const product = products[index];
      if (!product?.photos.some((photo) => photo.id === params.photoId)) return problem(404, 'not_found');
      const photos = product.photos
        .filter((photo) => photo.id !== params.photoId)
        .map((photo, position) => ({ ...photo, position }));
      products[index] = { ...product, photos, updatedAt: new Date().toISOString() };
      return new HttpResponse(null, { status: 204 });
    }, options),
    handleListAttributes(({ request }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const products = productsOf(session, request);
      return HttpResponse.json(attributesOf(session, request).map((attribute) => withUsage(attribute, products)));
    }, options),
    handleCreateAttribute(async ({ request }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const outcome = createAttribute(attributesOf(session, request), await request.json());
      return outcomeProblem(outcome, 'attribute_name_taken') ?? HttpResponse.json(outcome, { status: 201 });
    }, options),
    handleUpdateAttribute(async ({ request, params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const products = productsOf(session, request);
      const outcome = updateAttribute(
        attributesOf(session, request),
        products,
        String(params.attributeId),
        await request.json(),
      );
      const failed = outcomeProblem(outcome, 'attribute_name_taken');
      return failed ?? HttpResponse.json(withUsage(outcome as Attribute, products));
    }, options),
    handleDeleteAttribute(({ request, params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const removed = deleteAttribute(
        attributesOf(session, request),
        productsOf(session, request),
        String(params.attributeId),
      );
      return removed ? new HttpResponse(null, { status: 204 }) : problem(404, 'not_found');
    }, options),
    handleReplaceAttributeValues(async ({ request, params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const { values } = await request.json();
      const outcome = replaceAttributeValues(
        attributesOf(session, request),
        productsOf(session, request),
        String(params.attributeId),
        values,
      );
      if (typeof outcome === 'object' && 'taken' in outcome)
        return problem(409, 'attribute_value_taken', {
          errors: [{ field: `values.${outcome.taken}.value`, code: 'taken' }],
        });
      return outcomeProblem(outcome, 'attribute_value_taken') ?? HttpResponse.json(outcome);
    }, options),
    handleBulkUpdateProducts(async ({ request }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const { productIds, action, categoryId } = await request.json();
      const products = productsOf(session, request);
      const ids = new Set(productIds);
      let updated = 0;
      products.forEach((product, index) => {
        if (!ids.has(product.id)) return;
        updated += 1;
        products[index] =
          action === 'set_category'
            ? {
                ...product,
                categoryId: categoryId ?? null,
                importedFields:
                  product.categoryId === (categoryId ?? null)
                    ? product.importedFields
                    : product.importedFields.filter((field) => field !== 'category'),
              }
            : { ...product, isVisible: action === 'show' };
      });
      return HttpResponse.json({ updated });
    }, options),
    handleListImports(() => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      return HttpResponse.json({ items: importsOf(session).list(), nextCursor: null });
    }, options),
    handleCreateImport(async ({ request }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const { uploadId } = await request.json();
      const fileName = uploadNames.get(uploadId);
      if (!fileName || !uploads.has(uploadId)) return problem(422, 'upload_not_found');
      const created = importsOf(session).create(fileName);
      return created ? HttpResponse.json(created, { status: 202 }) : problem(409, 'import_in_progress');
    }, options),
    // до /imports/{importId}: иначе «template» сойдёт за id
    handleDownloadImportTemplate(() => {
      if (read().kind === 'out') return problem(401, 'unauthorized');
      return new HttpResponse(importTemplateXlsx(), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="shablon-tovarov.xlsx"',
        },
      });
    }, options),
    handleGetImport(({ params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const found = importsOf(session).get(params.importId);
      return found ? HttpResponse.json(found) : problem(404, 'not_found');
    }, options),
    handleCancelImport(({ params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const outcome = importsOf(session).cancel(params.importId);
      if (outcome === 'not_found') return problem(404, 'not_found');
      if (outcome === 'conflict') return problem(409, 'import_not_ready');
      return new HttpResponse(null, { status: 204 });
    }, options),
    handleSetImportMapping(async ({ request, params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const { mapping } = await request.json();
      const reason = mappingProblem(mapping);
      if (reason) return problem(422, 'validation_failed', { errors: [{ field: 'mapping', code: reason }] });
      const outcome = importsOf(session).setMapping(params.importId, mapping);
      if (outcome === 'not_found') return problem(404, 'not_found');
      if (outcome === 'conflict') return problem(409, 'import_not_ready');
      return HttpResponse.json(outcome, { status: 202 });
    }, options),
    handleListImportErrors(({ params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const errors = importsOf(session).errors(params.importId);
      return errors ? HttpResponse.json({ items: errors, nextCursor: null }) : problem(404, 'not_found');
    }, options),
    handleApplyImport(async ({ request, params }) => {
      const session = read();
      if (session.kind === 'out') return problem(401, 'unauthorized');
      const { zeroMissing } = await request.json();
      const outcome = importsOf(session).apply(params.importId, zeroMissing);
      if (outcome === 'not_found') return problem(404, 'not_found');
      if (outcome === 'conflict') return problem(409, 'import_not_ready');
      return HttpResponse.json(outcome, { status: 202 });
    }, options),
  ];
};
