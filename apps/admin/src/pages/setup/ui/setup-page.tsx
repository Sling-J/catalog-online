import { updateShopMutation } from '@catalog/contract/query';
import { Button } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';

import { AddressStep } from '@/features/setup-address';
import { LogoStep } from '@/features/setup-logo';
import { NameStep } from '@/features/setup-name';
import { WhatsappStep } from '@/features/setup-whatsapp';
import { applyShop, shopQueryOptions } from '@/entities/shop';
import { BackButton, SetupLayout } from '@/widgets/setup-layout';
import { SetupPreview } from '@/widgets/setup-preview';

import { firstIncompleteStep } from '@/pages/setup/lib';

const FORM_ID = 'setup-step';

/**
 * Мастер настройки 1–4 (FR-A2, A8): название → адрес → WhatsApp → логотип. Каждый шаг сохраняется по «Дальше»,
 * поэтому после перезагрузки мастер продолжается с первого незаполненного шага. Шаг — в адресе (`?step=`).
 */
export function SetupPage({ requestedStep }: { requestedStep: number | undefined }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: shop } = useSuspenseQuery(shopQueryOptions());
  const [name, setName] = useState(shop.name ?? '');
  const [logoPending, setLogoPending] = useState(false);
  const finish = useMutation(updateShopMutation());

  const reachable = firstIncompleteStep(shop);
  const step = Math.min(requestedStep ?? reachable, reachable);
  const savedName = shop.name ?? name;
  const goTo = (next: number) => void navigate({ to: '/setup', search: { step: next } });
  const done = () =>
    finish.mutate(
      { body: { setupCompleted: true } },
      {
        onSuccess: (updated) =>
          void applyShop(queryClient, updated).then(() => navigate({ to: '/products', replace: true })),
      },
    );

  const next = (
    <Button type="submit" form={FORM_ID} variant="dark" size="form" className="flex-1 lg:flex-none">
      <span className="lg:hidden">
        <Trans>Дальше</Trans>
      </span>
      <span className="hidden lg:inline">
        <Trans>Дальше →</Trans>
      </span>
    </Button>
  );
  const finishButtons = (phone: boolean): ReactNode => (
    <>
      <Button
        variant="line"
        size="form"
        disabled={logoPending || finish.isPending}
        onClick={done}
        className="flex-none"
      >
        <Trans>Пропустить</Trans>
      </Button>
      <Button
        variant="primary"
        size="form"
        disabled={logoPending || finish.isPending}
        onClick={done}
        className={phone ? 'flex-1' : undefined}
      >
        <Trans>Готово, к товарам →</Trans>
      </Button>
    </>
  );

  const screens: Record<number, { title: ReactNode; subtitle: ReactNode; body: ReactNode }> = {
    1: {
      title: <Trans>Как называется магазин?</Trans>,
      subtitle: <Trans>Так его увидят покупатели в шапке витрины и в превью ссылки.</Trans>,
      body: (
        <NameStep formId={FORM_ID} value={name} logo={shop.logo ?? null} onChange={setName} onDone={() => goTo(2)} />
      ),
    },
    2: {
      title: <Trans>Адрес вашей витрины</Trans>,
      subtitle: <Trans>По этой ссылке покупатели откроют каталог. Её можно поставить в Instagram.</Trans>,
      body: (
        <AddressStep
          formId={FORM_ID}
          name={savedName}
          initial={shop.subdomain ?? null}
          logo={shop.logo ?? null}
          onDone={() => goTo(3)}
        />
      ),
    },
    3: {
      title: <Trans>Куда присылать заказы?</Trans>,
      subtitle: (
        <Trans>Покупатель нажмёт «Заказать», и у него откроется чат с этим номером и готовым списком товаров.</Trans>
      ),
      body: <WhatsappStep formId={FORM_ID} name={savedName} initial={shop.whatsapp ?? null} onDone={() => goTo(4)} />,
    },
    4: {
      title: <Trans>Логотип магазина</Trans>,
      subtitle: (
        <Trans>
          Покажем его в шапке витрины и в превью ссылки. Можно пропустить — пока поставим буквы из названия.
        </Trans>
      ),
      body: <LogoStep name={savedName} logo={shop.logo ?? null} onPendingChange={setLogoPending} />,
    },
  };
  const screen = screens[step]!;

  return (
    <SetupLayout
      // свой ключ у каждого шага: поля и проверки начинаются заново
      key={step}
      step={step}
      title={screen.title}
      subtitle={screen.subtitle}
      phoneActions={
        step === 4 ? (
          finishButtons(true)
        ) : (
          <>
            {step > 1 && <BackButton variant="phone" onClick={() => goTo(step - 1)} />}
            {next}
          </>
        )
      }
      deskActions={
        <>
          {step > 1 && <BackButton variant="desk" onClick={() => goTo(step - 1)} />}
          <span className="flex-1" />
          {step === 4 ? finishButtons(false) : next}
        </>
      }
      preview={<SetupPreview name={step === 1 ? name : savedName} logo={shop.logo ?? null} initials={step === 4} />}
    >
      {screen.body}
    </SetupLayout>
  );
}
