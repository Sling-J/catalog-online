import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

/** Сиреневая колонка справа на компьютере: обещание сервиса и три шага (как на лендинге). */
export function Pitch() {
  return (
    <aside className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-lilac-field lg:flex">
      <div
        aria-hidden="true"
        className="absolute -top-[60px] -left-20 size-[360px] rounded-full bg-[radial-gradient(circle,rgb(255_255_255/0.7),rgb(255_255_255/0)_68%)]"
      />
      <div className="relative w-[460px]">
        <p className="text-[30px] leading-[1.15] font-extrabold tracking-[-0.03em]">
          <Trans>Покупатели видят размеры и наличие сами — и пишут вам уже с готовым заказом</Trans>
        </p>
        <ol className="mt-7 flex flex-col gap-3">
          <Step n={1}>
            <Trans>Загрузите товары из Excel или добавьте вручную</Trans>
          </Step>
          <Step n={2}>
            <Trans>Сфотографируйте товары с телефона</Trans>
          </Step>
          <Step n={3}>
            <Trans>Поделитесь ссылкой в Instagram и WhatsApp</Trans>
          </Step>
        </ol>
      </div>
    </aside>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3.5 rounded-[20px] bg-white/60 px-4 py-3.5">
      <span className="flex size-9 flex-none items-center justify-center rounded-full bg-sun font-extrabold shadow-[0_3px_0_var(--color-sun-underside)]">
        {n}
      </span>
      <span className="text-[16px] font-semibold">{children}</span>
    </li>
  );
}
