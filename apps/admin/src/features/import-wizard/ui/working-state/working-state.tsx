import type { ReactNode } from 'react';

import { Spinner } from '../spinner';

/**
 * API работает в фоне (макета нет): «Проверяем строки…», «Загружаем товары…». Белая карточка с крутилкой —
 * на телефоне во всю ширину, на компьютере 560 px.
 */
export function WorkingState({ title, text }: { title: ReactNode; text: ReactNode }) {
  return (
    <div
      aria-live="polite"
      className="mt-4 flex flex-col items-center gap-3 rounded-[20px] bg-white px-5 py-10 text-center shadow-[0_1px_0_#eceaf5,0_6px_16px_rgb(40_30_110/0.05)] lg:mt-[22px] lg:w-[560px] lg:rounded-[24px] lg:py-14"
    >
      <Spinner className="size-12 border-4" />
      <h2 className="mt-1 text-[18px] font-extrabold lg:text-[20px]">{title}</h2>
      <p className="max-w-[360px] text-[14px] leading-normal text-ink-quiet">{text}</p>
    </div>
  );
}
