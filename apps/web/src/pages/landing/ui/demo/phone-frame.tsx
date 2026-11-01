import { cx } from '@catalog/ui';
import type { ReactNode } from 'react';

const tones = {
  // телефон покупателя — светлое стекло
  glass:
    'border-white/85 bg-white/40 shadow-[0_40px_90px_rgb(40_20_110/0.28),inset_0_1px_0_#fff] backdrop-blur-[24px] backdrop-saturate-[1.7]',
  // телефон магазина — тёмное стекло
  night: 'border-white/30 bg-ink-night/82 shadow-[0_40px_90px_rgb(40_20_110/0.35)] backdrop-blur-[24px]',
};

/** Корпус телефона в примере: 330×660, до 1000 px — 300×620, на телефоне — до 340 в ширину и 600 в высоту. */
export function PhoneFrame({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return (
    <div
      className={cx(
        'box-border h-[660px] w-[330px] max-w-full rounded-device border p-3 max-[1000px]:h-[620px] max-[1000px]:w-[300px] max-[720px]:h-[600px] max-[720px]:w-[min(340px,100%)]',
        tones[tone],
      )}
    >
      {children}
    </div>
  );
}
