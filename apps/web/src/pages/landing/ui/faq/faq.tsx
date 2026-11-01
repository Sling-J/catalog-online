import { Trans, useLingui } from '@lingui/react/macro';

import { FAQ } from '@/pages/landing/lib';

/** Частые вопросы (FR-L1): стеклянные карточки «вопрос — ответ». */
export function Faq() {
  const { i18n } = useLingui();
  return (
    <section id="faq" className="mx-auto max-w-[860px] px-6 pt-section max-[720px]:pt-16">
      <h2 className="text-center text-[clamp(32px,4vw,52px)] font-extrabold tracking-[-0.04em]">
        <Trans>Частые вопросы</Trans>
      </h2>
      <dl className="mt-10 flex flex-col gap-3">
        {FAQ.map((item) => (
          <div
            key={item.question.id}
            className="rounded-panel border border-glass-edge bg-white/60 px-7 py-6 backdrop-blur-[18px]"
          >
            <dt className="text-[18px] font-bold">{i18n._(item.question)}</dt>
            <dd className="mt-2 text-[16px] leading-[1.55] text-ink-soft">{i18n._(item.answer)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
