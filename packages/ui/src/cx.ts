/** Склейка классов без зависимостей: пропускает пустые значения. */
export const cx = (...classes: Array<string | false | null | undefined>): string => classes.filter(Boolean).join(' ');
