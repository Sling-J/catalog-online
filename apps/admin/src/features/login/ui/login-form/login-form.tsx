import type { Me } from '@catalog/contract';
import { loginMutation } from '@catalog/contract/query';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { isUnauthorized, statusOf } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';
import { looksLikeEmail } from '@/shared/lib';
import { FormFooter, invalidFields, setFormError, setServerError, submitForm, useAppForm } from '@/shared/ui';

/** Вход (FR-A1, макет AdminAuthPhone / AdminAuthDesk, экраны 1–2): неверная пара — ошибка у пароля. */
export function LoginForm({ onLoggedIn }: { onLoggedIn: (me: Me) => void }) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const login = useMutation({ ...loginMutation(), onSuccess: onLoggedIn });
  const form = useAppForm({
    defaultValues: { email: '', password: '' },
    validators: {
      onSubmit: ({ value }) =>
        invalidFields({
          email: looksLikeEmail(value.email)
            ? undefined
            : value.email.trim()
              ? messages.emailInvalid
              : messages.emailRequired,
          password: value.password ? undefined : messages.passwordRequired,
        }),
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await login.mutateAsync({ body: { email: value.email.trim(), password: value.password } });
      } catch (error) {
        if (isUnauthorized(error)) setServerError(formApi, 'password', t`Неверная почта или пароль`);
        else setFormError(formApi, statusOf(error) === 429 ? messages.tooManyRequests : messages.failed);
      }
    },
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submitForm(form);
      }}
    >
      <div className="mt-[30px] flex flex-col gap-3.5 lg:mt-[34px] lg:gap-4">
        <form.AppField name="email">
          {(field) => <field.TextField label={t`Email`} type="email" inputMode="email" autoComplete="email" />}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.TextField
              label={t`Пароль`}
              type="password"
              autoComplete="current-password"
              note={
                <Link to="/forgot-password" className="text-iris">
                  <Trans>Забыли пароль?</Trans>
                </Link>
              }
            />
          )}
        </form.AppField>
      </div>
      <form.AppForm>
        <form.SubmitButton variant="primary" size="form" block className="mt-6 lg:mt-[26px]">
          <Trans>Войти</Trans>
        </form.SubmitButton>
        <form.FormServerError />
      </form.AppForm>
      <FormFooter>
        <Trans>Ещё нет каталога?</Trans>{' '}
        <Link to="/register" className="font-bold text-iris">
          <Trans>Создать</Trans>
        </Link>
      </FormFooter>
    </form>
  );
}
