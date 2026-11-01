import type { CartItem } from '@/entities/cart';
import { formatPrice } from '@/shared/lib';

// в сообщении WhatsApp неразрывные пробелы цен ни к чему
const NBSP = String.fromCharCode(0xa0);
const plain = (text: string) => text.replaceAll(NBSP, ' ');

/**
 * Текст заявки магазину по FR-V8:
 * «1. Куртка (Размер: 110, Цвет: синий) × 1 — 25 000 ₸». В строке цена за штуку, внизу итог.
 * Слова-подписи приходят готовыми (их переводит интерфейс), здесь только сборка.
 */
export function buildOrderText({
  greeting,
  totalLabel,
  commentLabel,
  items,
  total,
  comment,
}: {
  greeting: string;
  totalLabel: string;
  commentLabel: string;
  items: CartItem[];
  total: number;
  comment: string;
}): string {
  const lines = items.map((item, index) => {
    const variant = item.variantLabel ? ` (${item.variantLabel})` : '';
    return `${index + 1}. ${item.name}${variant} × ${item.quantity} — ${plain(formatPrice(item.price))}`;
  });
  const parts = [greeting, ...lines, `${totalLabel}: ${plain(formatPrice(total))}`];
  const note = comment.trim();
  if (note) parts.push(`${commentLabel}: ${note}`);
  return parts.join('\n');
}
