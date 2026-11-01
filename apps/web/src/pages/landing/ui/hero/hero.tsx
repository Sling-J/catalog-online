import { Trans } from '@lingui/react/macro';

const button = 'puffy rounded-pill text-[18px] font-bold max-[720px]:block max-[720px]:w-full max-[720px]:text-center';

/** Первый экран: оффер, пояснение и два призыва — регистрация и демо-магазин (FR-L1, FR-L2). */
export function Hero({ registerUrl, demoShopUrl }: { registerUrl: string; demoShopUrl: string }) {
  return (
    <section id="top" className="mx-auto max-w-[1200px] px-6 pt-[84px] text-center max-[720px]:pt-11">
      <h1 className="mx-auto max-w-[14ch] text-display text-balance">
        <Trans>Хватит отвечать «есть ли размер?»</Trans>
      </h1>
      <p className="mx-auto mt-[26px] max-w-[44ch] text-body-lg text-ink-soft">
        <Trans>
          Покупатель сам видит размеры и наличие, а готовый заказ приходит вам в WhatsApp. Попробуйте ниже: соберите
          заказ и отправьте его в WhatsApp.
        </Trans>
      </p>
      <div className="mt-[34px] flex flex-wrap justify-center gap-3.5">
        <a href={registerUrl} className={`${button} bg-sun px-8 py-[19px] shadow-[0_7px_0_var(--color-sun-underside)]`}>
          <Trans>Создать каталог бесплатно</Trans>
        </a>
        <a
          href={demoShopUrl}
          className={`${button} border border-white/85 bg-white/55 px-8 py-[18px] shadow-[0_7px_0_rgb(29_27_75/0.16)] backdrop-blur-[16px]`}
        >
          <Trans>Посмотреть пример</Trans>
        </a>
      </div>
    </section>
  );
}
