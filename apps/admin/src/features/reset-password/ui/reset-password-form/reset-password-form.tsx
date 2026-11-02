import { resetPasswordMutation } from '@catalog/contract/query';
import { Button, Field } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';

import { fieldErrors, statusOf } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';
import { MIN_PASSWORD } from '@/shared/lib';
import { FormError, PasswordNote } from '@/shared/ui';

/**
 * «Новый пароль» по ссылке из письма (макет AdminAuth*). После сохранения API закрывает все сессии — дальше вход;
 * устаревшая ссылка (410) — экран «Ссылка устарела».
 */
export function ResetPasswordForm({
  token,
  onDone,
  onExpired,
}: {
  token: string;
  onDone: () => void;
  onExpired: () => void;
}) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ password?: string; form?: string }>({});
  const reset = useMutation(resetPasswordMutation());

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setError({ password: messages.passwordTooShort });
      return;
    }
    reset.mutate(
      { body: { token, password } },
      {
        onSuccess: onDone,
        onError: (failure) => {
          if (statusOf(failure) === 410) onExpired();
          else if (fieldErrors(failure).password) setError({ password: messages.passwordTooShort });
          else setError({ form: messages.failed });
        },
      },
    );
  };

  return (
    <form noValidate onSubmit={submit}>
      <div className="mt-[30px] lg:mt-[34px]">
        <Field
          label={t`Новый пароль`}
          type="password"
          autoComplete="new-password"
          value={password}
          note={<PasswordNote password={password} tooShort={Boolean(error.password)} />}
          onChange={(event) => {
            setPassword(event.target.value);
            setError({});
          }}
          error={error.password}
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        size="form"
        block
        disabled={reset.isPending}
        className="mt-6 lg:mt-[26px]"
      >
        <Trans>Сохранить пароль</Trans>
      </Button>
      {error.form && <FormError>{error.form}</FormError>}
    </form>
  );
}
