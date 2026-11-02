import { resendVerificationEmailMutation } from '@catalog/contract/query';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';

import { SendAgain } from '@/shared/ui';

/** «Отправить письмо ещё раз» — письмо для подтверждения почты (A9), с паузой между письмами. */
export function ResendVerificationButton() {
  const resend = useMutation(resendVerificationEmailMutation());
  return (
    <SendAgain
      variant="primary"
      pending={resend.isPending}
      onSend={() =>
        resend
          .mutateAsync({})
          .then(() => true)
          .catch(() => false)
      }
    >
      <Trans>Отправить письмо ещё раз</Trans>
    </SendAgain>
  );
}
