import { Demo } from './demo';
import { Faq } from './faq';
import { FinalCta } from './final-cta';
import { Hero } from './hero';
import { LandingHeader } from './landing-header';
import { Steps } from './steps';

/**
 * Лендинг сервиса (макет N «Сиреневый, два телефона», E2): шапка, первый экран, интерактивный пример, три шага,
 * вопросы, финальный призыв. Один файл на три ширины — 1440 / 834 / 390, переломы на 1000 и 720 px.
 * «Создать каталог» ведёт в регистрацию в админке, «Посмотреть пример» — в демо-магазин (FR-L2).
 */
export function LandingPage({ registerUrl, demoShopUrl }: { registerUrl: string; demoShopUrl: string }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-lilac-field font-sans text-ink-night selection:bg-sun selection:text-ink-night">
      {/* световые пятна фона медленно плывут */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute top-50 left-[-10%] size-175 rounded-full bg-[radial-gradient(circle,rgb(255_255_255/0.55),rgb(255_255_255/0)_65%)] motion-safe:animate-blob" />
        <div className="absolute top-225 right-[-12%] size-190 rounded-full bg-[radial-gradient(circle,rgb(255_210_63/0.35),rgb(255_210_63/0)_65%)] motion-safe:animate-blob" />
      </div>
      <div className="relative">
        <LandingHeader registerUrl={registerUrl} />
        <main>
          <Hero registerUrl={registerUrl} demoShopUrl={demoShopUrl} />
          <Demo />
          <Steps />
          <Faq />
          <FinalCta registerUrl={registerUrl} />
        </main>
      </div>
    </div>
  );
}
