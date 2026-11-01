import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

const steps: { title: ReactNode; text: ReactNode; className: string }[] = [
  {
    title: <Trans>Загрузите Excel</Trans>,
    text: <Trans>Из кассовой программы или 1С. Новая загрузка — свежие остатки.</Trans>,
    className: 'bg-sun text-ink-night shadow-[0_8px_0_var(--color-sun-underside)] [&_p]:text-sun-ink',
  },
  {
    title: <Trans>Добавьте фото</Trans>,
    text: <Trans>Прямо с телефона. Можно и без фото.</Trans>,
    className: 'bg-coral text-coral-ink shadow-[0_8px_0_var(--color-coral-underside)]',
  },
  {
    title: <Trans>Поделитесь ссылкой</Trans>,
    text: <Trans>В Instagram и WhatsApp. Заказы — вам в WhatsApp.</Trans>,
    className: 'bg-mint text-mint-ink shadow-[0_8px_0_var(--color-mint-underside)]',
  },
];

/** «Три шага — и готово» (FR-L1): стеклянная карточка с тремя пухлыми шагами. */
export function Steps() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 pt-section max-[720px]:pt-16">
      <div className="rounded-stage border border-glass-edge bg-glass p-[clamp(32px,5vw,64px)] backdrop-blur-[24px] backdrop-saturate-[1.6] max-[720px]:rounded-card">
        <h2 className="max-w-[18ch] text-headline">
          <Trans>Три шага — и готово</Trans>
        </h2>
        <ol className="mt-10 flex flex-wrap gap-5">
          {steps.map((step, index) => (
            <li key={index} className={`flex-[1_1_280px] rounded-card p-[30px] ${step.className}`}>
              <div className="text-[56px] leading-none font-extrabold">{index + 1}</div>
              <h3 className="mt-3.5 mb-2 text-title">{step.title}</h3>
              <p className="text-[16px] leading-[1.5]">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
