import { resendVerificationEmailMutation } from '@catalog/contract/query';
import { cx } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';

import { useCooldown } from '@/shared/hooks';

/** «Отправить ещё раз» ссылкой в тексте (карточка почты в «Вход и пароль»); после отправки — пауза 45 секунд. */
export function ResendVerificationLink() {
  const resend = useMutation(resendVerificationEmailMutation());
  const { left, start } = useCooldown(45);
  const idle = left === 0 && !resend.isPending;
  return (
    <button
      type="button"
      disabled={!idle}
      onClick={() => resend.mutate({}, { onSuccess: start })}
      className={cx('leading-[normal] font-bold', idle ? 'text-iris' : 'text-ink-muted')}
    >
      <Trans>Отправить ещё раз</Trans>
    </button>
  );
}
