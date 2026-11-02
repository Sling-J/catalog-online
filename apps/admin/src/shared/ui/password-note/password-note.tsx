import { Trans } from '@lingui/react/macro';

import { isStrongPassword } from '@/shared/lib';

/** Подсказка справа от подписи пароля: «короткий» при ошибке длины, «надёжный» — когда пароль хороший. */
export function PasswordNote({ password, tooShort }: { password: string; tooShort?: boolean }) {
  if (tooShort) {
    return (
      <span className="text-coral-underside">
        <Trans>короткий</Trans>
      </span>
    );
  }
  if (!isStrongPassword(password)) return null;
  return (
    <span className="text-stock-in">
      <Trans>надёжный</Trans>
    </span>
  );
}
