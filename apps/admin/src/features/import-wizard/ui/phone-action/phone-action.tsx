import type { ReactNode } from 'react';

/**
 * Главная кнопка шага на телефоне — над нижним меню, как «Загрузить 215 строк» (макет AdminPhone, экран 5);
 * под ней в разметке — место, чтобы конец списка не прятался за кнопкой. На компьютере кнопка в колонке справа.
 */
export function PhoneAction({ children }: { children: ReactNode }) {
  return (
    <>
      <div aria-hidden="true" className="h-[72px] lg:hidden" />
      <div className="fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-10 px-4 lg:hidden">
        {children}
      </div>
    </>
  );
}
