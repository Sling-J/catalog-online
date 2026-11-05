import { changePasswordMutation } from '@catalog/contract/query';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { fieldErrors, isUnauthorized } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';
import { MIN_PASSWORD } from '@/shared/lib';
import { invalidFields, PasswordNote, setFormError, setServerError, submitForm, useAppForm } from '@/shared/ui';

import { CHANGE_PASSWORD_FORM_ID } from '@/features/change-password/constants';

/**
 * «Сменить пароль» (макет AdminAuth*, «Вход и пароль»). Кнопка отправки — снаружи, по `CHANGE_PASSWORD_FORM_ID`.
 * После сохранения поля очищаются, подсказка меняется на «Пароль сохранён».
 */
export function ChangePasswordForm() {
  const { t } = useLingui();
  const messages = useFormMessages();
  const [saved, setSaved] = useState(false);
  const change = useMutation(changePasswordMutation());
  const form = useAppForm({
    defaultValues: { current: '', next: '' },
    validators: {
      onSubmit: ({ value }) =>
        invalidFields({
          current: value.current ? undefined : messages.passwordRequired,
          next: value.next.length < MIN_PASSWORD ? messages.passwordTooShort : undefined,
        }),
    },
    // любая правка — подсказка снова «На этом устройстве вы останетесь…»
    listeners: { onChange: () => setSaved(false) },
    onSubmit: async ({ value, formApi }) => {
      try {
        await change.mutateAsync({ body: { currentPassword: value.current, newPassword: value.next } });
        formApi.reset();
        setSaved(true);
      } catch (error) {
        if (isUnauthorized(error)) setServerError(formApi, 'current', t`Неверный пароль`);
        else if (fieldErrors(error).newPassword) setServerError(formApi, 'next', messages.passwordTooShort);
        else setFormError(formApi, messages.failed);
      }
    },
  });

  return (
    <form
      id={CHANGE_PASSWORD_FORM_ID}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        // кнопка снаружи формы — повторное нажатие во время отправки ничего не делает
        if (!form.state.isSubmitting) void submitForm(form);
      }}
    >
      <h2 className="mt-[22px] text-[15px] font-bold lg:mt-[26px]">
        <Trans>Сменить пароль</Trans>
      </h2>
      <div className="mt-2.5 flex flex-col gap-3.5">
        <form.AppField name="current">
          {(field) => (
            <field.TextField
              label={t`Текущий пароль`}
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
        <form.AppField name="next">
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
      <p className="mt-2.5 text-[13px] leading-[1.5] text-ink-muted">
        {saved ? (
          <>
            <span className="font-semibold text-stock-in">
              <Trans>Пароль сохранён.</Trans>
            </span>{' '}
            <Trans>На остальных устройствах вышли.</Trans>
          </>
        ) : (
          <Trans>На этом устройстве вы останетесь, на остальных — выйдем.</Trans>
        )}
      </p>
      <form.AppForm>
        <form.FormServerError />
      </form.AppForm>
    </form>
  );
}
