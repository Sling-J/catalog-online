import { forgotPasswordMutation } from '@catalog/contract/query';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { statusOf } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';
import { looksLikeEmail } from '@/shared/lib';
import { FormFooter, invalidFields, setFormError, submitForm, useAppForm } from '@/shared/ui';

/** «Восстановление пароля» (макет AdminAuth*, экран «Забыли пароль»): почта → письмо со ссылкой. */
export function ForgotPasswordForm({ onSent }: { onSent: (email: string) => void }) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const forgot = useMutation(forgotPasswordMutation());
  const form = useAppForm({
    defaultValues: { email: '' },
    validators: {
      onSubmit: ({ value }) =>
        invalidFields({
          email: looksLikeEmail(value.email)
            ? undefined
            : value.email.trim()
              ? messages.emailInvalid
              : messages.emailRequired,
        }),
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await forgot.mutateAsync({ body: { email: value.email.trim() } });
        onSent(value.email.trim());
      } catch (error) {
        setFormError(formApi, statusOf(error) === 429 ? messages.tooManyRequests : messages.failed);
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
      <div className="mt-[30px] lg:mt-[34px]">
        <form.AppField name="email">
          {(field) => <field.TextField label={t`Email`} type="email" inputMode="email" autoComplete="email" />}
        </form.AppField>
      </div>
      <form.AppForm>
        <form.SubmitButton variant="primary" size="form" block className="mt-6 lg:mt-[26px]">
          <Trans>Прислать ссылку</Trans>
        </form.SubmitButton>
        <form.FormServerError />
      </form.AppForm>
      <FormFooter>
        <Trans>Вспомнили?</Trans>{' '}
        <Link to="/login" className="font-bold text-iris">
          <Trans>Войти</Trans>
        </Link>
      </FormFooter>
    </form>
  );
}
