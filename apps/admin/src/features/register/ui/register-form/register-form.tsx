import type { Me } from '@catalog/contract';
import { registerMutation } from '@catalog/contract/query';
import { Button, Field } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState, type FormEvent, type ReactNode } from 'react';

import { fieldErrors, problemCode, statusOf } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';
import { looksLikeEmail, MIN_PASSWORD } from '@/shared/lib';
import { FormError, FormFooter, FormNote, PasswordNote } from '@/shared/ui';

type Errors = { email?: ReactNode; password?: string; form?: string };

/**
 * Регистрация (FR-A1, макет AdminPhone2 / AdminDesk2, экран 1; ошибки — AdminAuthPhone, экран 3).
 * Почту и длину пароля проверяем до отправки, остальное — по ответу API: 409 `email_taken`, 422 по полям.
 */
export function RegisterForm({ onRegistered }: { onRegistered: (me: Me) => void }) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const register = useMutation({ ...registerMutation(), onSuccess: onRegistered });

  const loginLink = (
    <Link to="/login" className="font-bold text-iris">
      <Trans>Войти</Trans>
    </Link>
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    if (!looksLikeEmail(email)) next.email = email.trim() ? messages.emailInvalid : messages.emailRequired;
    if (password.length < MIN_PASSWORD) next.password = messages.passwordTooShort;
    setErrors(next);
    if (next.email || next.password) return;
    register.mutate(
      { body: { email: email.trim(), password } },
      {
        onError: (error) => {
          if (problemCode(error) === 'email_taken') {
            setErrors({
              email: (
                <>
                  <Trans>Каталог с этой почтой уже есть.</Trans> {loginLink}
                </>
              ),
            });
          } else if (fieldErrors(error).password) {
            setErrors({ password: messages.passwordTooShort });
          } else {
            setErrors({ form: statusOf(error) === 429 ? messages.tooManyRequests : messages.failed });
          }
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
          autoComplete="new-password"
          value={password}
          note={<PasswordNote password={password} tooShort={Boolean(errors.password)} />}
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
        disabled={register.isPending}
        className="mt-6 lg:mt-[26px]"
      >
        <Trans>Создать каталог</Trans>
      </Button>
      {errors.form && <FormError>{errors.form}</FormError>}
      <FormNote>
        <Trans>Пришлём письмо для подтверждения почты</Trans>
      </FormNote>
      <FormFooter>
        <Trans>Уже есть каталог?</Trans> {loginLink}
      </FormFooter>
    </form>
  );
}
