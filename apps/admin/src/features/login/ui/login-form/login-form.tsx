import type { Me } from '@catalog/contract';
import { loginMutation } from '@catalog/contract/query';
import { Button, Field } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';

import { isUnauthorized, statusOf } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';
import { looksLikeEmail } from '@/shared/lib';
import { FormError, FormFooter } from '@/shared/ui';

type Errors = { email?: string; password?: string; form?: string };

/** Вход (FR-A1, макет AdminAuthPhone / AdminAuthDesk, экраны 1–2): неверная пара — ошибка у пароля. */
export function LoginForm({ onLoggedIn }: { onLoggedIn: (me: Me) => void }) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const login = useMutation({ ...loginMutation(), onSuccess: onLoggedIn });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    if (!looksLikeEmail(email)) next.email = email.trim() ? messages.emailInvalid : messages.emailRequired;
    if (!password) next.password = messages.passwordRequired;
    setErrors(next);
    if (next.email || next.password) return;
    login.mutate(
      { body: { email: email.trim(), password } },
      {
        onError: (error) => {
          if (isUnauthorized(error)) setErrors({ password: t`Неверная почта или пароль` });
          else setErrors({ form: statusOf(error) === 429 ? messages.tooManyRequests : messages.failed });
        },
      },
    );
  };

  return (
    <form noValidate onSubmit={submit}>
      <div className="mt-[30px] flex flex-col gap-3.5 lg:mt-[34px] lg:gap-4">
        <Field
          label={t`Email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors(({ email: _, ...rest }) => rest);
          }}
          error={errors.email}
        />
        <Field
          label={t`Пароль`}
          type="password"
          autoComplete="current-password"
          value={password}
          note={
            <Link to="/forgot-password" className="text-iris">
              <Trans>Забыли пароль?</Trans>
            </Link>
          }
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors(({ password: _, ...rest }) => rest);
          }}
          error={errors.password}
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        size="form"
        block
        disabled={login.isPending}
        className="mt-6 lg:mt-[26px]"
      >
        <Trans>Войти</Trans>
      </Button>
      {errors.form && <FormError>{errors.form}</FormError>}
      <FormFooter>
        <Trans>Ещё нет каталога?</Trans>{' '}
        <Link to="/register" className="font-bold text-iris">
          <Trans>Создать</Trans>
        </Link>
      </FormFooter>
    </form>
  );
}
