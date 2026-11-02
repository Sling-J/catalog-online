import { changePasswordMutation } from '@catalog/contract/query';
import { Field } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';

import { fieldErrors, isUnauthorized } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';
import { MIN_PASSWORD } from '@/shared/lib';
import { FormError, PasswordNote } from '@/shared/ui';

import { CHANGE_PASSWORD_FORM_ID } from '@/features/change-password/constants';

type Errors = { current?: string; next?: string; form?: string };

/**
 * «Сменить пароль» (макет AdminAuth*, «Вход и пароль»). Кнопка отправки — снаружи, по `CHANGE_PASSWORD_FORM_ID`.
 * После сохранения поля очищаются, подсказка меняется на «Пароль сохранён».
 */
export function ChangePasswordForm() {
  const { t } = useLingui();
  const messages = useFormMessages();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);
  const change = useMutation(changePasswordMutation());

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (change.isPending) return;
    const found: Errors = {};
    if (!current) found.current = messages.passwordRequired;
    if (next.length < MIN_PASSWORD) found.next = messages.passwordTooShort;
    setErrors(found);
    if (found.current || found.next) return;
    change.mutate(
      { body: { currentPassword: current, newPassword: next } },
      {
        onSuccess: () => {
          setCurrent('');
          setNext('');
          setSaved(true);
        },
        onError: (error) => {
          if (isUnauthorized(error)) setErrors({ current: t`Неверный пароль` });
          else if (fieldErrors(error).newPassword) setErrors({ next: messages.passwordTooShort });
          else setErrors({ form: messages.failed });
        },
      },
    );
  };

  return (
    <form id={CHANGE_PASSWORD_FORM_ID} noValidate onSubmit={submit}>
      <h2 className="mt-[22px] text-[15px] font-bold lg:mt-[26px]">
        <Trans>Сменить пароль</Trans>
      </h2>
      <div className="mt-2.5 flex flex-col gap-3.5">
        <Field
          label={t`Текущий пароль`}
          type="password"
          autoComplete="current-password"
          value={current}
          note={
            <Link to="/forgot-password" className="text-iris">
              <Trans>Забыли пароль?</Trans>
            </Link>
          }
          onChange={(event) => {
            setCurrent(event.target.value);
            setSaved(false);
            setErrors(({ current: _, ...rest }) => rest);
          }}
          error={errors.current}
        />
        <Field
          label={t`Новый пароль`}
          type="password"
          autoComplete="new-password"
          value={next}
          note={<PasswordNote password={next} tooShort={Boolean(errors.next)} />}
          onChange={(event) => {
            setNext(event.target.value);
            setSaved(false);
            setErrors(({ next: _, ...rest }) => rest);
          }}
          error={errors.next}
        />
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
      {errors.form && <FormError>{errors.form}</FormError>}
    </form>
  );
}
