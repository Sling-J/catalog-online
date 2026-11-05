import { resetPasswordMutation } from '@catalog/contract/query';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';

import { fieldErrors, statusOf } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';
import { MIN_PASSWORD } from '@/shared/lib';
import { invalidFields, PasswordNote, setFormError, setServerError, submitForm, useAppForm } from '@/shared/ui';

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
  const reset = useMutation(resetPasswordMutation());
  const form = useAppForm({
    defaultValues: { password: '' },
    validators: {
      onSubmit: ({ value }) =>
        invalidFields({ password: value.password.length < MIN_PASSWORD ? messages.passwordTooShort : undefined }),
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await reset.mutateAsync({ body: { token, password: value.password } });
        onDone();
      } catch (error) {
        if (statusOf(error) === 410) onExpired();
        else if (fieldErrors(error).password) setServerError(formApi, 'password', messages.passwordTooShort);
        else setFormError(formApi, messages.failed);
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
        <form.AppField name="password">
          {(field) => (
            <field.TextField
              label={t`Новый пароль`}
              type="password"
              autoComplete="new-password"
              note={<PasswordNote password={field.state.value} tooShort={field.state.meta.errors.length > 0} />}
            />
          )}
        </form.AppField>
      </div>
      <form.AppForm>
        <form.SubmitButton variant="primary" size="form" block className="mt-6 lg:mt-[26px]">
          <Trans>Сохранить пароль</Trans>
        </form.SubmitButton>
        <form.FormServerError />
      </form.AppForm>
    </form>
  );
}
