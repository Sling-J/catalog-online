/** Адрес витрины (FR-A2): латиница, цифры, дефис, 3–30 символов, не с дефиса и не на дефис — как `SubdomainValue`. */
export const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

/**
 * Служебные имена, которые магазин занять не может: наши адреса (админка, API, почта, статика), то, что покупатель
 * примет за сервис, и технические имена DNS. В моках — короткий список, здесь полный.
 */
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  // адреса сервиса
  'www',
  'app',
  'api',
  'admin',
  'staff',
  'dashboard',
  'panel',
  'console',
  'static',
  'cdn',
  'assets',
  'img',
  'images',
  'media',
  'files',
  'uploads',
  'storage',
  's3',
  'mail',
  'email',
  'smtp',
  'imap',
  'pop',
  'webmail',
  'mx',
  'ns',
  'ns1',
  'ns2',
  'dns',
  'ftp',
  // похожее на сервис для покупателя
  'help',
  'support',
  'docs',
  'blog',
  'news',
  'status',
  'about',
  'contact',
  'contacts',
  'faq',
  'legal',
  'privacy',
  'terms',
  'pricing',
  'billing',
  'pay',
  'payment',
  'shop',
  'store',
  'catalog',
  'katalog',
  'login',
  'logout',
  'register',
  'signup',
  'signin',
  'auth',
  'account',
  'accounts',
  'id',
  'oauth',
  // окружения и служебное
  'demo',
  'test',
  'dev',
  'stage',
  'staging',
  'preview',
  'beta',
  'sandbox',
  'internal',
  'root',
  'system',
  'localhost',
  'new',
  'null',
  'undefined',
]);

export type SubdomainProblem = 'invalid' | 'reserved';

/** Что не так с адресом, не заглядывая в базу (занятость проверяет сервис). */
export function subdomainProblem(value: string): SubdomainProblem | null {
  if (!SUBDOMAIN_PATTERN.test(value)) return 'invalid';
  if (RESERVED_SUBDOMAINS.has(value)) return 'reserved';
  return null;
}
