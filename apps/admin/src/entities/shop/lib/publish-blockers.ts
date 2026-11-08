import type { Shop } from '@catalog/contract';

/** Что мешает опубликовать витрину: нет товаров, почта не подтверждена (A9). */
export type PublishBlocker = 'products' | 'email';

/** Все причины сразу, а не первая (UX-аудит, L2): исправил одно — не упрёшься во второе. */
export function publishBlockers(readiness: Shop['readiness'], emailVerified: boolean): PublishBlocker[] {
  const blockers: PublishBlocker[] = [];
  if (readiness.productCount === 0) blockers.push('products');
  if (!emailVerified) blockers.push('email');
  return blockers;
}
