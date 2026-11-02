import type { Image } from '@catalog/contract';
import { checkSubdomainOptions, updateShopMutation } from '@catalog/contract/query';
import { Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';

import { applyShop, ShopAvatar, storefrontRootDomain, SUBDOMAIN_PATTERN, subdomainFromName } from '@/entities/shop';
import { problemCode } from '@/shared/api';
import { useDebouncedValue, useFormMessages } from '@/shared/hooks';
import { BigField, BigFieldCaption } from '@/shared/ui';

type Status = 'checking' | 'ok' | 'taken' | 'invalid';

/**
 * Мастер, шаг 2 — адрес витрины (макет AdminPhone2 / AdminDesk2; «Проверяем…» и «занят» — AdminSetupStates).
 * Адрес предлагаем по названию, свободен ли — проверяем на лету, пока ввод затих. На телефоне — превью ссылки (A13).
 */
export function AddressStep({
  formId,
  name,
  initial,
  logo,
  onDone,
}: {
  formId: string;
  name: string;
  initial: string | null;
  logo: Image | null;
  onDone: () => void;
}) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(() => initial ?? subdomainFromName(name));
  // адрес, который API отверг при сохранении (успели занять, пока человек думал)
  const [rejected, setRejected] = useState<string>();
  const [failed, setFailed] = useState(false);
  const debounced = useDebouncedValue(value, 400);
  const valid = SUBDOMAIN_PATTERN.test(value);
  const check = useQuery({
    ...checkSubdomainOptions({ query: { value: debounced } }),
    enabled: valid && debounced === value,
  });
  const save = useMutation(updateShopMutation());

  const status: Status = !valid
    ? 'invalid'
    : rejected === value
      ? 'taken'
      : debounced !== value || check.isFetching || !check.data
        ? 'checking'
        : check.data.available
          ? 'ok'
          : check.data.reason === 'invalid'
            ? 'invalid'
            : 'taken';
  const root = storefrontRootDomain();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (status !== 'ok') return;
    setFailed(false);
    save.mutate(
      { body: { subdomain: value } },
      {
        onSuccess: (shop) => void applyShop(queryClient, shop).then(onDone),
        onError: (error) => {
          const code = problemCode(error);
          if (code === 'subdomain_taken' || code === 'subdomain_reserved') setRejected(value);
          else setFailed(true);
        },
      },
    );
  };

  return (
    <form id={formId} noValidate onSubmit={submit}>
      <BigField
        tone={status === 'ok' ? 'ok' : status === 'taken' || status === 'invalid' ? 'error' : 'idle'}
        className="mt-[22px] lg:mt-[30px]"
      >
        {/* поле по ширине текста, чтобы домен стоял сразу за адресом */}
        <span className="relative inline-block min-w-[2px]">
          <span aria-hidden="true" className="invisible font-bold whitespace-pre">
            {value || ' '}
          </span>
          <input
            autoFocus
            value={value}
            maxLength={30}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            aria-label={t`Адрес витрины`}
            aria-invalid={status === 'taken' || status === 'invalid' ? true : undefined}
            onChange={(event) => setValue(event.target.value.toLowerCase().replace(/\s/g, '-'))}
            className="absolute inset-0 w-full bg-transparent font-bold outline-none"
          />
        </span>
        <span className="text-ink-muted">.{root}</span>
        {status === 'ok' && (
          <span className="ml-auto text-stock-in">
            <Icon name="check" size={20} strokeWidth={2.8} className="lg:size-[22px]" />
          </span>
        )}
      </BigField>
      {status === 'ok' && (
        <BigFieldCaption tone="ok" className="mt-2 lg:mt-2.5">
          <Trans>Адрес свободен</Trans>
        </BigFieldCaption>
      )}
      {status === 'checking' && (
        <BigFieldCaption tone="checking" className="mt-2 lg:mt-2.5">
          <Trans>Проверяем…</Trans>
        </BigFieldCaption>
      )}
      {status === 'taken' && (
        <BigFieldCaption tone="error" className="mt-2 lg:mt-2.5">
          <Trans>Этот адрес уже занят — попробуйте другой</Trans>
        </BigFieldCaption>
      )}
      {status === 'invalid' && (
        <BigFieldCaption tone="error" className="mt-2 lg:mt-2.5">
          <Trans>Такой адрес не подходит</Trans>
        </BigFieldCaption>
      )}
      {failed && (
        <BigFieldCaption tone="error" className="mt-2 lg:mt-2.5">
          {messages.failed}
        </BigFieldCaption>
      )}
      <p className="mt-3.5 text-[13px] leading-[1.5] text-ink-muted lg:mt-2 lg:text-[14px]">
        <Trans>Латиница, цифры и дефис, от 3 до 30 символов. Придумали по названию — можно поменять.</Trans>
      </p>
      <div className="mt-[26px] rounded-[20px] bg-lilac-mist p-3.5 lg:hidden">
        <div className="text-[13px] font-semibold text-ink-quiet">
          <Trans>Так ссылка будет выглядеть в WhatsApp</Trans>
        </div>
        <div className="mt-2.5 flex gap-2.5 rounded-[14px] bg-white p-2.5">
          <ShopAvatar name={name} logo={logo} size="link" square />
          <div className="min-w-0 text-[13px] leading-[1.4]">
            <b>
              <Trans>{name} — каталог</Trans>
            </b>
            <div className="truncate text-ink-quiet">
              {value}.{root}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
