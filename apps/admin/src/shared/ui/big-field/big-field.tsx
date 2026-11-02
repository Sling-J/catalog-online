import { cx } from '@catalog/ui';
import type { ReactNode } from 'react';

export type BigFieldTone = 'idle' | 'error' | 'ok';

const tones: Record<BigFieldTone, string> = {
  idle: 'border-[#e2dff0] focus-within:border-ink-night',
  error: 'border-coral-underside',
  ok: 'border-stock-in',
};

/**
 * Крупное поле мастера (макеты AdminPhone2 / AdminDesk2): 56 px на телефоне, 60 px на компьютере плюс рамка 2 px —
 * чернилами при вводе, коралл при ошибке, зелёная — когда адрес свободен. Внутрь кладётся `<input>` и подписи.
 */
export function BigField({
  tone = 'idle',
  className,
  children,
}: {
  tone?: BigFieldTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={cx(
        // как в макете: высота без рамки (box-content) — с рамкой 60 px на телефоне и 64 px на компьютере
        'box-content flex h-14 items-center rounded-[18px] border-2 bg-white px-4 text-[17px] lg:h-[60px] lg:px-[18px] lg:text-[18px]',
        tones[tone],
        className,
      )}
    >
      {children}
    </label>
  );
}
