import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { Brand } from '@/shared/ui';

import { StepProgress } from './step-progress';

export const SETUP_STEPS = 4;

/**
 * Экран мастера (макеты AdminPhone2 / AdminDesk2, шаги 1–4). Телефон: полоска шагов сверху, кнопки закреплены
 * внизу. Компьютер: слева на белом (640 px) логотип сервиса, шаг и кнопки под полями, справа — живое превью.
 */
export function SetupLayout({
  step,
  title,
  subtitle,
  children,
  phoneActions,
  deskActions,
  preview,
}: {
  step: number;
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
  phoneActions: ReactNode;
  deskActions: ReactNode;
  preview: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <main className="w-full pt-5 pb-[calc(100px+env(safe-area-inset-bottom))] lg:w-[640px] lg:flex-none lg:bg-white lg:px-16 lg:py-12">
        <div className="hidden lg:block">
          <Brand />
        </div>
        <StepProgress step={step} total={SETUP_STEPS} className="px-4 lg:mt-14 lg:px-0" />
        <div className="px-4 pt-[22px] lg:px-0 lg:pt-7">
          <div className="text-[14px] font-semibold text-ink-quiet">
            <Trans>
              Шаг {step} из {SETUP_STEPS}
            </Trans>
          </div>
          <h1 className="mt-1.5 text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] lg:mt-2 lg:text-[38px]">
            {title}
          </h1>
          <p className="mt-2 text-[15px] leading-[1.5] text-ink-soft lg:mt-2.5 lg:text-[16px] lg:leading-[1.55]">
            {subtitle}
          </p>
          {children}
          <div className="mt-10 hidden gap-2.5 lg:flex">{deskActions}</div>
        </div>
      </main>
      <div className="fixed inset-x-0 bottom-0 bg-[linear-gradient(rgb(251_250_255/0),var(--color-paper)_30%)] px-4 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex gap-2.5">{phoneActions}</div>
      </div>
      {preview}
    </div>
  );
}
