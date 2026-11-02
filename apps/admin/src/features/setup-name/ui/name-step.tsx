import type { Image } from '@catalog/contract';
import { updateShopMutation } from '@catalog/contract/query';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';

import { applyShop, ShopAvatar } from '@/entities/shop';
import { useFormMessages } from '@/shared/hooks';
import { BigField, BigFieldCaption } from '@/shared/ui';

/**
 * Мастер, шаг 1 — название (макет AdminPhone2 / AdminDesk2; пустое — AdminSetupStates, экран 1).
 * Название живое: страница передаёт его и в превью. На телефоне под полем — карточка «Шапка витрины».
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
  const [error, setError] = useState<string>();
  const save = useMutation(updateShopMutation());

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const name = value.trim();
    if (!name) {
      setError(t`Введите название магазина`);
      return;
    }
    save.mutate(
      { body: { name } },
      {
        onSuccess: (shop) => void applyShop(queryClient, shop).then(onDone),
        onError: () => setError(messages.failed),
      },
    );
  };

  return (
    <form id={formId} noValidate onSubmit={submit}>
      <BigField tone={error ? 'error' : 'idle'} className="mt-[22px] lg:mt-[30px]">
        <input
          autoFocus
          value={value}
          maxLength={80}
          aria-label={t`Название магазина`}
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            onChange(event.target.value);
            setError(undefined);
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
