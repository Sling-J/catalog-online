import { forgotPasswordMutation } from '@catalog/contract/query';
import { Button, Field } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';

import { statusOf } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';
import { looksLikeEmail } from '@/shared/lib';
import { FormError, FormFooter } from '@/shared/ui';

/** «Восстановление пароля» (макет AdminAuth*, экран «Забыли пароль»): почта → письмо со ссылкой. */
export function ForgotPasswordForm({ onSent }: { onSent: (email: string) => void }) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<{ email?: string; form?: string }>({});
  const forgot = useMutation(forgotPasswordMutation());

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!looksLikeEmail(email)) {
      setError({ email: email.trim() ? messages.emailInvalid : messages.emailRequired });
      return;
    }
    forgot.mutate(
      { body: { email: email.trim() } },
      {
        onSuccess: () => onSent(email.trim()),
        onError: (failure) =>
          setError({ form: statusOf(failure) === 429 ? messages.tooManyRequests : messages.failed }),
      },
    );
  };

  return (
    <form noValidate onSubmit={submit}>
      <div className="mt-[30px] lg:mt-[34px]">
        <Field
          label={t`Email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError({});
          }}
          error={error.email}
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        size="form"
        block
        disabled={forgot.isPending}
        className="mt-6 lg:mt-[26px]"
      >
        <Trans>Прислать ссылку</Trans>
      </Button>
      {error.form && <FormError>{error.form}</FormError>}
      <FormFooter>
        <Trans>Вспомнили?</Trans>{' '}
        <Link to="/login" className="font-bold text-iris">
          <Trans>Войти</Trans>
        </Link>
      </FormFooter>
    </form>
  );
}
