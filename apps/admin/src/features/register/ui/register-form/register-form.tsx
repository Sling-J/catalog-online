import type { Me } from '@catalog/contract';
import { registerMutation } from '@catalog/contract/query';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { fieldErrors, problemCode, statusOf } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';
import { looksLikeEmail, MIN_PASSWORD } from '@/shared/lib';
import {
  FormFooter,
  FormNote,
  invalidFields,
  PasswordNote,
  setFormError,
  setServerError,
  submitForm,
  useAppForm,
} from '@/shared/ui';

/**
 * Регистрация (FR-A1, макет AdminPhone2 / AdminDesk2, экран 1; ошибки — AdminAuthPhone, экран 3).
 * Почту и длину пароля проверяем до отправки, остальное — по ответу API: 409 `email_taken`, 422 по полям.
 */
export function RegisterForm({ onRegistered }: { onRegistered: (me: Me) => void }) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const register = useMutation({ ...registerMutation(), onSuccess: onRegistered });

  const loginLink = (
    <Link to="/login" className="font-bold text-iris">
      <Trans>Войти</Trans>
    </Link>
  );

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
          password: value.password.length < MIN_PASSWORD ? messages.passwordTooShort : undefined,
        }),
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await register.mutateAsync({ body: { email: value.email.trim(), password: value.password } });
      } catch (error) {
        if (problemCode(error) === 'email_taken') {
          setServerError(
            formApi,
            'email',
            <>
              <Trans>Каталог с этой почтой уже есть.</Trans> {loginLink}
            </>,
          );
        } else if (fieldErrors(error).password) {
          setServerError(formApi, 'password', messages.passwordTooShort);
        } else {
          setFormError(formApi, statusOf(error) === 429 ? messages.tooManyRequests : messages.failed);
        }
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
              autoComplete="new-password"
              note={<PasswordNote password={field.state.value} tooShort={field.state.meta.errors.length > 0} />}
            />
          )}
        </form.AppField>
      </div>
      <form.AppForm>
        <form.SubmitButton variant="primary" size="form" block className="mt-6 lg:mt-[26px]">
          <Trans>Создать каталог</Trans>
        </form.SubmitButton>
        <form.FormServerError />
      </form.AppForm>
      <FormNote>
        <Trans>Пришлём письмо для подтверждения почты</Trans>
      </FormNote>
      <FormFooter>
        <Trans>Уже есть каталог?</Trans> {loginLink}
      </FormFooter>
    </form>
  );
}
