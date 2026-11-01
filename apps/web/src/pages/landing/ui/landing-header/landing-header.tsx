import { Trans, useLingui } from '@lingui/react/macro';

/** Шапка лендинга: стеклянная «пилюля» с логотипом, якорями и главным призывом. На телефоне — логотип и кнопка. */
export function LandingHeader({ registerUrl }: { registerUrl: string }) {
  const { t } = useLingui();
  return (
    <header className="mx-auto mt-5 max-w-[1200px] px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-pill border border-white/75 bg-white/45 py-2.5 pr-2.5 pl-6 backdrop-blur-[20px] backdrop-saturate-[1.6]">
        <a href="#top" className="text-[19px] font-extrabold">
          catalog·online
        </a>
        <nav aria-label={t`Основное`} className="flex flex-wrap items-center gap-6 text-[15px] font-semibold">
          <a href="#demo" className="hover:text-black max-[720px]:hidden">
            <Trans>Попробовать</Trans>
          </a>
          <a href="#faq" className="hover:text-black max-[720px]:hidden">
            <Trans>Вопросы</Trans>
          </a>
          <a
            href={registerUrl}
            className="puffy rounded-pill bg-ink-night px-[22px] py-3 text-white shadow-[0_5px_0_var(--color-ink-underside)]"
          >
            <Trans>Создать каталог</Trans>
          </a>
        </nav>
      </div>
    </header>
  );
}
