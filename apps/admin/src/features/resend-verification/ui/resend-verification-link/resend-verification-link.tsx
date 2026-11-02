import { resendVerificationEmailMutation } from '@catalog/contract/query';
import { cx } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useCooldown } from '@/shared/hooks';

/**
 * Повторное письмо ссылкой в тексте: «Отправить ещё раз» в «Вход и пароль», «Ещё раз» в чек-листе главной
 * (`children`, `className` — размер подписи). После отправки — пауза 45 секунд.
 */
export function ResendVerificationLink({ children, className }: { children?: ReactNode; className?: string }) {
  const resend = useMutation(resendVerificationEmailMutation());
  const { left, start } = useCooldown(45);
  const idle = left === 0 && !resend.isPending;
  return (
    <button
      type="button"
      disabled={!idle}
      onClick={() => resend.mutate({}, { onSuccess: start })}
      className={cx('leading-[normal] font-bold', idle ? 'text-iris' : 'text-ink-muted', className)}
    >
      {children ?? <Trans>Отправить ещё раз</Trans>}
    </button>
  );
}
