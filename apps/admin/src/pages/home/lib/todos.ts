export type TodoKey = 'email' | 'no_photo' | 'out_of_stock' | 'import';

/**
 * «Нужно сделать» на главной после запуска (UX-аудит, U7): короткий список дел вместо обхода разделов.
 * Почта и товары без фото — сначала (без фото товар не виден); «Обновить остатки из Excel» есть всегда —
 * это частая задача (admin.md, задача 3).
 */
export function buildTodos({
  emailVerified,
  noPhoto,
  outOfStock,
}: {
  emailVerified: boolean;
  noPhoto: number;
  outOfStock: number;
}): TodoKey[] {
  return [
    ...(emailVerified ? [] : (['email'] as const)),
    ...(noPhoto > 0 ? (['no_photo'] as const) : []),
    ...(outOfStock > 0 ? (['out_of_stock'] as const) : []),
    'import',
  ];
}
