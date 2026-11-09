/**
 * Разрешён ли адрес фронта для CORS. Шаблон с `*` — любой поддомен (витрины магазинов):
 * `http://*.localhost:3000` пропускает `http://aigerim-kids.localhost:3000`, но не `http://localhost:3000`.
 */
export function isAllowedOrigin(origin: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => {
    if (!pattern.includes('*')) return pattern === origin;
    const [prefix = '', suffix = ''] = pattern.split('*');
    if (!origin.startsWith(prefix) || !origin.endsWith(suffix)) return false;
    const middle = origin.slice(prefix.length, origin.length - suffix.length);
    return /^[a-z0-9-]+$/.test(middle);
  });
}
