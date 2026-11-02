export const MIN_PASSWORD = 8;

/** Пароль надёжный: не короче 8 символов и хотя бы два вида знаков (буквы, цифры, прочие). */
export function isStrongPassword(password: string): boolean {
  if (password.length < MIN_PASSWORD) return false;
  const kinds = [/\p{L}/u, /\d/, /[^\p{L}\d]/u].filter((kind) => kind.test(password)).length;
  return kinds >= 2;
}

/** Похоже на почту: что-то@что-то.что-то, без пробелов. Точную проверку делает API. */
export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
