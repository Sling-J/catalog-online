import { updateShopMutation } from '@catalog/contract/query';
import { Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';

import { applyShop } from '@/entities/shop';
import { useFormMessages } from '@/shared/hooks';
import { BigField, BigFieldCaption } from '@/shared/ui';

import { formatPhone, PHONE_DIGITS, whatsappTestLink } from '@/features/setup-whatsapp/lib';

/**
 * Мастер, шаг 3 — WhatsApp (макет AdminPhone2 / AdminDesk2; неверный номер — AdminSetupStates). Номер — 10 цифр
 * после +7. Пример сообщения с живым названием и «Отправить себе тестовое сообщение» — чат с этим номером.
 */
export function WhatsappStep({
  formId,
  name,
  initial,
  onDone,
}: {
  formId: string;
  name: string;
  initial: string | null;
  onDone: () => void;
}) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const queryClient = useQueryClient();
  const [digits, setDigits] = useState(() => initial?.replace(/^\+7/, '') ?? '');
  const [error, setError] = useState<string>();
  const save = useMutation(updateShopMutation());
  const invalid = t`Номер — 10 цифр после +7`;
  const greeting = t`Здравствуйте! Заказ с сайта ${name}:`;
  const line = t`1. Куртка демисезонная (Рост: 110) × 1 — 18 900 ₸`;
  const total = t`Итого: 18 900 ₸`;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (digits.length !== PHONE_DIGITS) {
      setError(invalid);
      return;
    }
    save.mutate(
      { body: { whatsapp: `+7${digits}` } },
      {
        onSuccess: (shop) => void applyShop(queryClient, shop).then(onDone),
        onError: () => setError(messages.failed),
      },
    );
  };

  return (
    <form id={formId} noValidate onSubmit={submit}>
      <div className="mt-[22px] flex gap-2 lg:mt-[30px] lg:gap-2.5">
        <span className="box-content flex h-14 items-center rounded-[18px] border-[1.5px] border-[#e2dff0] bg-white px-3.5 text-[17px] font-semibold lg:h-[60px] lg:px-[18px] lg:text-[18px]">
          +7
        </span>
        <BigField tone={error ? 'error' : 'idle'} className="flex-1">
          <input
            autoFocus
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={formatPhone(digits)}
            aria-label={t`Номер WhatsApp`}
            aria-invalid={error ? true : undefined}
            onChange={(event) => {
              setDigits(event.target.value.replace(/\D/g, '').slice(0, PHONE_DIGITS));
              setError(undefined);
            }}
            className="w-full bg-transparent tabular-nums outline-none"
          />
        </BigField>
      </div>
      {error && (
        <BigFieldCaption tone="error" className="mt-2 lg:mt-2.5">
          {error}
        </BigFieldCaption>
      )}
      <div className="mt-[22px] rounded-[20px] bg-mint-soft p-4 text-mint-ink lg:mt-[18px]">
        <div className="flex items-center gap-2 font-bold">
          <Icon name="whatsapp" size={20} />
          <Trans>Пример сообщения</Trans>
        </div>
        <p className="mt-2.5 rounded-[16px_16px_16px_4px] bg-white px-3.5 py-3 text-[14px] leading-[1.5] text-ink-night">
          {greeting}
          <br />
          {line}
          <br />
          {total}
        </p>
      </div>
      <a
        href={whatsappTestLink(digits, [greeting, line, total].join('\n'))}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => {
          if (digits.length === PHONE_DIGITS) return;
          event.preventDefault();
          setError(invalid);
        }}
        className="mt-3.5 block text-[15px] font-bold text-iris lg:mt-3"
      >
        <Trans>Отправить себе тестовое сообщение</Trans>
      </a>
    </form>
  );
}
