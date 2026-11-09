import argon2 from 'argon2';

/** Почта для поиска и хранения: без пробелов по краям, в нижнем регистре. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Хеш пароля — argon2id с настройками библиотеки по умолчанию (ADR 0001). */
export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

/** Пароль совпадает с хешем. Битый хеш — как неверный пароль. */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/**
 * Проверка «впустую», когда аккаунта с такой почтой нет: ответ занимает столько же времени, сколько при неверном
 * пароле, — по времени нельзя узнать, зарегистрирована ли почта.
 */
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= argon2.hash('dummy-password-for-timing');
  await verifyPassword(await dummyHash, password);
  return false;
}
