import type { BrowserContext, Request } from '@playwright/test';

/**
 * Журнал запросов браузера к API (T-502, решение основателя 2026-11-14: «авто + список на шагах»). Видит запросы всех
 * страниц контекста к `/v1/…` — и админки (через прокси Vite), и витрины (к API напрямую). Запросы сервера витрины
 * (SSR) браузер не видит — так и нужно: первая загрузка должна приходить готовой.
 *
 * Автоматические правила (`issues()`, проверяются после каждого теста):
 * - дубль — тот же `GET` (метод, путь, параметры) ещё раз, если между ними не было изменяющего запроса и
 *   перезагрузки страницы и прошло меньше времени свежести кеша (30 с у QueryClient фронтов);
 * - прерванный запрос (`net::ERR_ABORTED` и другие сбои сети) — обычно запрос, который сразу отменили и послали снова;
 * - `GET` к API на другом адресе с заголовками сверх простых — перед ним браузер шлёт `OPTIONS`;
 * - ответ 4xx / 5xx, которого тест не ждал (`allowStatus`); 401 на `GET /v1/auth/me` до входа ожидаем всегда;
 * - ответ 4xx / 5xx на остальные ресурсы (страницы, скрипты, картинки) — тоже напрасный запрос, если тест его не ждал
 *   (`allowResource`: страница скрытого магазина законно отвечает 410).
 *
 * На шагах — `expectRequests(действие, [список])`: ровно эти запросы, без лишних и без недостающих.
 */
export type ApiCall = {
  method: string;
  /** Путь с параметрами по алфавиту, параметры раскодированы: `/v1/admin/products?filter=hidden&limit=30`. */
  path: string;
  /** Полный адрес как есть (с `preview`). */
  url: string;
  body: string | null;
  crossOrigin: boolean;
  /** Заголовки, из-за которых браузер шлёт `OPTIONS` (кроме простых). */
  unsafeHeaders: string[];
  /** Номер загрузки документа: перезагрузка страницы законно перечитывает всё. */
  epoch: number;
  /** Сколько изменяющих запросов было отправлено до этого. */
  mutationsBefore: number;
  startedAt: number;
  status?: number;
  failure?: string;
  done: boolean;
};

/** Время свежести кеша QueryClient фронтов (`staleTime`): повтор позже — законное перечитывание. */
const STALE_MS = 30_000;
const SAFE_HEADERS = new Set(['accept', 'accept-language', 'content-language', 'range']);
const SIMPLE_CONTENT_TYPES = /^(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)/;

const isApi = (url: URL) => url.pathname.startsWith('/v1/');

export function formatPath(rawUrl: string): string {
  const url = new URL(rawUrl);
  const params = [...url.searchParams.entries()]
    .filter(([key]) => key !== 'preview')
    .sort(([a], [b]) => a.localeCompare(b));
  const query = params.map(([key, value]) => `${key}=${value}`).join('&');
  return query ? `${url.pathname}?${query}` : url.pathname;
}

/** `*` в шаблоне — любые символы: `GET /v1/admin/products/*`. */
function matches(pattern: string, value: string): boolean {
  const source = pattern
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${source}$`).test(value);
}

export class ApiLog {
  readonly calls: ApiCall[] = [];
  private readonly byRequest = new Map<Request, ApiCall>();
  private readonly allowedStatuses: { pattern: string; status: number }[] = [
    { pattern: 'GET /v1/auth/me', status: 401 },
  ];
  private readonly allowedRepeats: string[] = [];
  private readonly allowedFailures: string[] = [];
  private readonly allowedResources: string[] = [];
  private readonly resourceErrors: { url: string; status: number }[] = [];
  private epoch = 0;
  private mutations = 0;

  constructor(context: BrowserContext) {
    context.on('request', (request) => this.onRequest(request));
    context.on('requestfinished', (request) => void this.onFinished(request));
    context.on('requestfailed', (request) => this.onFailed(request));
    context.on('response', (response) => {
      const url = new URL(response.url());
      if (isApi(url) || response.status() < 400) return;
      this.resourceErrors.push({ url: `${url.host}${url.pathname}`, status: response.status() });
    });
  }

  /** Ответ 4xx / 5xx на ресурс ожидаем: шаблон по хосту и пути, например `net-takogo.localhost:3100/`. */
  allowResource(pattern: string): void {
    this.allowedResources.push(pattern);
  }

  /** Ответ с этим статусом ожидаем (например, 401 при неверном пароле). */
  allowStatus(pattern: string, status: number): void {
    this.allowedStatuses.push({ pattern, status });
  }

  /** Повторы законны: опрос статуса (импорт, сжатие фото). */
  allowRepeat(pattern: string): void {
    this.allowedRepeats.push(pattern);
  }

  /** Сбой сети законен (например, уход со страницы посреди загрузки). */
  allowFailure(pattern: string): void {
    this.allowedFailures.push(pattern);
  }

  /** Запросы с этого места: `const mark = api.mark(); …; api.since(mark)`. */
  mark(): number {
    return this.calls.length;
  }

  since(mark: number): ApiCall[] {
    return this.calls.slice(mark);
  }

  /** Ждёт, пока запросы к API закончатся и 600 мс не будет новых (не дольше 15 с). */
  async settle(quietMs = 600, maxMs = 15_000): Promise<void> {
    const started = Date.now();
    let lastCount = -1;
    let quietSince = Date.now();
    while (Date.now() - started < maxMs) {
      const inFlight = this.calls.some((call) => !call.done);
      if (this.calls.length !== lastCount || inFlight) {
        lastCount = this.calls.length;
        quietSince = Date.now();
      } else if (Date.now() - quietSince >= quietMs) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`Запросы к API не утихли за ${maxMs} мс:\n${this.describe(this.calls.filter((c) => !c.done))}`);
  }

  /**
   * Действие должно послать ровно эти запросы (порядок не важен): `['GET /v1/admin/products?limit=30', …]`.
   * Ждёт, пока запросы утихнут, и сравнивает.
   */
  async expectRequests(action: () => Promise<unknown>, expected: string[]): Promise<ApiCall[]> {
    await this.settle();
    const mark = this.mark();
    await action();
    await this.settle();
    const got = this.since(mark);
    const left = got.map((call) => `${call.method} ${call.path}`);
    const missing: string[] = [];
    for (const pattern of expected) {
      const index = left.findIndex((value) => matches(pattern, value));
      if (index === -1) missing.push(pattern);
      else left.splice(index, 1);
    }
    if (missing.length || left.length) {
      throw new Error(
        [
          'Запросы к API не совпали с ожидаемыми.',
          missing.length ? `Не было:\n  ${missing.join('\n  ')}` : '',
          left.length ? `Лишние:\n  ${left.join('\n  ')}` : '',
          `Все запросы шага:\n${this.describe(got)}`,
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }
    return got;
  }

  /** Нарушения автоматических правил; пусто — всё хорошо. */
  issues(): string[] {
    const issues: string[] = [];
    const key = (call: ApiCall) => `${call.method} ${call.path}`;
    for (const error of this.resourceErrors) {
      if (!this.allowedResources.some((pattern) => matches(pattern, error.url))) {
        issues.push(`Ресурс ответил ${error.status}: ${error.url}`);
      }
    }
    this.calls.forEach((call, index) => {
      const name = key(call);
      if (call.failure && !this.allowedFailures.some((p) => matches(p, name))) {
        issues.push(`Запрос прерван (${call.failure}): ${name}`);
      }
      if (
        call.status !== undefined &&
        call.status >= 400 &&
        !this.allowedStatuses.some((a) => a.status === call.status && matches(a.pattern, name))
      ) {
        issues.push(`Неожиданный ответ ${call.status}: ${name}`);
      }
      if (call.crossOrigin && call.method === 'GET' && call.unsafeHeaders.length) {
        issues.push(`GET с заголовками ${call.unsafeHeaders.join(', ')} — браузер шлёт перед ним OPTIONS: ${name}`);
      }
      if (call.method !== 'GET' || this.allowedRepeats.some((p) => matches(p, name))) return;
      const previous = this.calls.slice(0, index).findLast((other) => key(other) === name && !other.failure);
      if (
        previous &&
        previous.epoch === call.epoch &&
        previous.mutationsBefore === call.mutationsBefore &&
        call.startedAt - previous.startedAt < STALE_MS
      ) {
        issues.push(`Дубль через ${call.startedAt - previous.startedAt} мс без изменений данных: ${name}`);
      }
    });
    return issues;
  }

  describe(calls: ApiCall[] = this.calls): string {
    return calls
      .map((call) => {
        const result = call.failure ?? (call.status === undefined ? '…' : String(call.status));
        return `  ${call.method} ${call.path} → ${result}`;
      })
      .join('\n');
  }

  private onRequest(request: Request): void {
    const url = new URL(request.url());
    if (request.resourceType() === 'document' && request.isNavigationRequest()) {
      const frame = safeFrame(request);
      if (frame && frame.parentFrame() === null) this.epoch++;
    }
    if (!isApi(url) || request.method() === 'OPTIONS') return;
    const headers = request.headers();
    const pageUrl = safeFrame(request)?.url();
    const crossOrigin = !!pageUrl && pageUrl.startsWith('http') && new URL(pageUrl).origin !== url.origin;
    const unsafeHeaders = Object.entries(headers)
      .filter(([name, value]) => {
        if (SAFE_HEADERS.has(name)) return false;
        if (name === 'content-type') return !SIMPLE_CONTENT_TYPES.test(value);
        // служебные заголовки браузера Playwright показывает вместе с заголовками страницы
        return !/^(sec-|user-agent|referer|origin|accept-encoding|cookie|connection|host)/.test(name);
      })
      .map(([name]) => name);
    const method = request.method();
    const call: ApiCall = {
      method,
      path: formatPath(request.url()),
      url: request.url(),
      body: request.postData(),
      crossOrigin,
      unsafeHeaders,
      epoch: this.epoch,
      mutationsBefore: this.mutations,
      startedAt: Date.now(),
      done: false,
    };
    if (method !== 'GET' && method !== 'HEAD') this.mutations++;
    this.calls.push(call);
    this.byRequest.set(request, call);
  }

  private async onFinished(request: Request): Promise<void> {
    const call = this.byRequest.get(request);
    if (!call) return;
    const response = await request.response().catch(() => null);
    call.status = response?.status();
    call.done = true;
  }

  private onFailed(request: Request): void {
    const call = this.byRequest.get(request);
    if (!call) return;
    call.failure = request.failure()?.errorText ?? 'сбой';
    call.done = true;
  }
}

function safeFrame(request: Request) {
  try {
    return request.frame();
  } catch {
    // запросы service worker не принадлежат странице
    return null;
  }
}
