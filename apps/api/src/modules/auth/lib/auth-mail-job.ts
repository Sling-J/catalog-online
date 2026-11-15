import { defineJob } from '../../../core/jobs/index.js';
import type { TokenPurpose } from '../auth.repository.js';

/**
 * Письмо входа — задача pg-boss (T-609, scaling.md SC6). Ставится в той же транзакции, что и запись, ради которой
 * письмо (регистрация), и не ждёт SMTP в запросе. В данных — только аккаунт и назначение: токен выпускает
 * обработчик прямо перед отправкой, поэтому ссылка из письма не лежит открытым текстом в таблицах очереди, а срок
 * ссылки считается от отправки. Повторы: 1, 2, 4, 8, 16 минут — сбой SMTP на полчаса письмо не теряет.
 */
export const AUTH_MAIL = defineJob<{ accountId: string; purpose: TokenPurpose }>('auth.mail', {
  retryLimit: 5,
  retryDelay: 60,
  retryBackoff: true,
});
