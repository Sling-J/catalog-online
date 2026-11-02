import { useLingui } from '@lingui/react/macro';

import { MIN_PASSWORD } from '@/shared/lib';

/** Общие тексты ошибок форм входа и пароля. */
export function useFormMessages() {
  const { t } = useLingui();
  return {
    emailRequired: t`Введите почту`,
    emailInvalid: t`Проверьте почту — похоже, в ней ошибка`,
    passwordRequired: t`Введите пароль`,
    passwordTooShort: t`Минимум ${MIN_PASSWORD} символов`,
    tooManyRequests: t`Слишком много попыток. Подождите минуту и попробуйте снова.`,
    failed: t`Не получилось. Проверьте интернет и попробуйте ещё раз.`,
  };
}
