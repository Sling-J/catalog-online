import { Trans } from '@lingui/react/macro';

/** Финальный призыв на тёмной карточке и подвал (FR-L1, FR-L2). */
export function FinalCta({ registerUrl }: { registerUrl: string }) {
  return (
    <section id="start" className="mx-auto max-w-[1200px] px-6 pt-section pb-12 max-[720px]:pt-16">
      <div className="rounded-[52px] bg-ink-night px-8 py-[clamp(40px,6vw,88px)] text-center text-white shadow-[0_40px_90px_rgb(29_27_75/0.35)] max-[720px]:rounded-card">
        <h2 className="mx-auto max-w-[14ch] text-[clamp(36px,5.4vw,78px)] leading-[1.02] font-extrabold tracking-[-0.045em]">
          <Trans>Пусть покупатели смотрят сами</Trans>
        </h2>
        <a
          href={registerUrl}
          className="puffy mt-9 inline-block rounded-pill bg-sun px-9 py-5 text-[19px] font-bold text-ink-night shadow-[0_7px_0_var(--color-sun-underside)]"
        >
          <Trans>Создать каталог бесплатно</Trans>
        </a>
        <p className="mt-[18px] text-[15px] text-[#b9b5e8]">
          <Trans>Понадобится только email и таблица товаров</Trans>
        </p>
      </div>
      <footer className="mt-12 flex flex-wrap justify-between gap-4 text-[14px] text-ink-soft">
        <span>
          <Trans>catalog·online — рабочее название</Trans>
        </span>
        {/* контакты сервиса ещё не выбраны — open-questions.md */}
        <span>
          <Trans>Казахстан</Trans>
        </span>
      </footer>
    </section>
  );
}
