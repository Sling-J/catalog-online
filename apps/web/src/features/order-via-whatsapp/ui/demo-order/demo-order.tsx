import { Button } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

/**
 * Демо-магазин (S14), вместо перехода в WhatsApp: какое сообщение получил бы магазин, и регистрация —
 * гость пришёл с лендинга посмотреть, как это работает.
 */
export function DemoOrder({ text, registerUrl, onBack }: { text: string; registerUrl: string; onBack: () => void }) {
  return (
    <div>
      <p className="text-[14px] leading-[1.45] text-ink-soft">
        <Trans>
          Это пример витрины, заказ никуда не уйдёт. В настоящем магазине покупатель отправит это сообщение в WhatsApp
          магазина:
        </Trans>
      </p>
      <pre className="mt-3 max-h-[40dvh] overflow-auto rounded-field bg-[#f6f5fb] px-3.5 py-3 font-sans text-[14px] leading-[1.5] whitespace-pre-wrap text-ink-night">
        {text}
      </pre>
      <p className="mt-4 text-[15px] font-bold">
        <Trans>Сделайте такой каталог для своего магазина — из данных вашей учётной системы.</Trans>
      </p>
      <div className="mt-3.5 flex flex-col gap-2">
        <a
          href={registerUrl}
          className="press inline-flex h-14 w-full items-center justify-center rounded-pill bg-sun text-[16px] font-bold text-ink-night shadow-[0_5px_0_var(--color-sun-underside)] hover:bg-sun-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris lg:h-[52px] lg:text-[15px] lg:shadow-press-sun"
        >
          <Trans>Создать свой каталог</Trans>
        </a>
        <Button variant="soft" size="state" block onClick={onBack}>
          <Trans>Вернуться в корзину</Trans>
        </Button>
      </div>
    </div>
  );
}
