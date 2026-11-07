import type { ReactNode } from 'react';

/**
 * Кнопки сохранения внизу экрана телефона поверх прокрутки: снизу 24 px, сверху растушёвка в цвет бумаги
 * (макеты AdminPhone, экран 3, и AdminPhone2, экран 7). На компьютере кнопки — в строке заголовка.
 */
export function SaveBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-[linear-gradient(rgb(251_250_255/0),var(--color-paper)_30%)] px-4 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] lg:hidden">
      {children}
    </div>
  );
}
