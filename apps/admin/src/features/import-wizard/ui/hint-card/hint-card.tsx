import { cx } from '@catalog/ui';
import type { ReactNode } from 'react';

const tones = {
  ok: 'bg-mint-soft text-mint-ink',
  problem: 'bg-[#ffe9e1] text-[#8a2e12]',
  note: 'bg-white text-ink-soft shadow-[0_1px_0_#eceaf5]',
} as const;

/**
 * Карточка-пояснение в колонке справа (макет AdminDesk, экран 3): мятная — «Все обязательные поля найдены»,
 * белая — «Запомним это сопоставление»; коралловая — чего не хватает (макета нет, цвета — плитки «ошибки»).
 * Мятная и коралловая — с крупным заголовком, белая — с жирной строкой в тексте.
 */
export function HintCard({
  tone,
  title,
  children,
  className,
}: {
  tone: keyof typeof tones;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const note = tone === 'note';
  return (
    <div
      role={tone === 'problem' ? 'alert' : undefined}
      className={cx(
        'rounded-[18px] p-3.5 text-[14px] lg:rounded-[24px] lg:p-[18px]',
        // в макете у белой карточки межстрочный 1,5 у всего блока, у цветной — только у текста под заголовком
        note && 'leading-normal',
        tones[tone],
        className,
      )}
    >
      <div className={note ? 'font-bold text-ink-night' : 'text-[15px] font-extrabold lg:text-[17px]'}>{title}</div>
      <div className={note ? undefined : 'mt-1.5 leading-normal'}>{children}</div>
    </div>
  );
}
