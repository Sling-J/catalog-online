import type { Image } from '@catalog/contract';
import { updateShopMutation } from '@catalog/contract/query';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { applyShop, ShopAvatar } from '@/entities/shop';
import { useFormMessages } from '@/shared/hooks';
import { BigField, BigFieldCaption, invalidFields, setServerError, submitForm, useAppForm } from '@/shared/ui';

/**
 * Мастер, шаг 1 — название (макет AdminPhone2 / AdminDesk2; пустое — AdminSetupStates, экран 1).
 * Название живое: каждую правку отдаём странице (`onChange`) — для превью. На телефоне под полем — карточка
 * «Шапка витрины».
 */
export function NameStep({
  formId,
  value,
  logo,
  onChange,
  onDone,
}: {
  formId: string;
  value: string;
  logo: Image | null;
  onChange: (name: string) => void;
  onDone: () => void;
}) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const queryClient = useQueryClient();
  const save = useMutation(updateShopMutation());
  const form = useAppForm({
    defaultValues: { name: value },
    validators: {
      onSubmit: ({ value: { name } }) =>
        invalidFields({ name: name.trim() ? undefined : t`Введите название магазина` }),
    },
    onSubmit: async ({ value: { name }, formApi }) => {
      try {
        const shop = await save.mutateAsync({ body: { name: name.trim() } });
        await applyShop(queryClient, shop);
        onDone();
      } catch {
        // ошибка связи — под полем, как ошибка ввода
        setServerError(formApi, 'name', messages.failed);
      }
    },
  });

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submitForm(form);
      }}
    >
      <form.Field name="name" listeners={{ onChange: ({ value: name }) => onChange(name) }}>
        {(field) => {
          const error = field.state.meta.errors[0] as ReactNode;
          return (
            <>
              <BigField tone={error ? 'error' : 'idle'} className="mt-[22px] lg:mt-[30px]">
                <input
                  autoFocus
                  value={field.state.value}
                  maxLength={80}
                  aria-label={t`Название магазина`}
                  aria-invalid={error ? true : undefined}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                    field.setErrorMap({ onServer: undefined });
                  }}
                  className="w-full bg-transparent font-bold outline-none"
                />
              </BigField>
              {error ? (
                <BigFieldCaption tone="error" className="mt-2.5">
                  {error}
                </BigFieldCaption>
              ) : (
                <BigFieldCaption tone="muted" className="mt-2.5">
                  <Trans>Можно поменять в любой момент в настройках.</Trans>
                </BigFieldCaption>
              )}
            </>
          );
        }}
      </form.Field>
      <div className="mt-[26px] rounded-[20px] bg-lilac-mist p-3.5 lg:hidden">
        <div className="text-[13px] font-semibold text-ink-quiet">
          <Trans>Шапка витрины</Trans>
        </div>
        <div className="mt-2.5 flex items-center gap-2.5 rounded-2xl bg-white p-3">
          {logo ? (
            <ShopAvatar name={value} logo={logo} />
          ) : (
            <span className="box-content size-10 flex-none rounded-full border-[1.5px] border-dashed border-[#c9c3e3]" />
          )}
          <div className="min-w-0">
            <div
              className={
                value.trim() ? 'truncate text-[16px] font-extrabold' : 'text-[16px] font-extrabold text-ink-muted'
              }
            >
              {value.trim() || <Trans>Название магазина</Trans>}
            </div>
            <div className="text-[12px] text-ink-quiet">
              <Trans>адрес и график добавите потом</Trans>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
