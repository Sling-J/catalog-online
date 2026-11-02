import type { ReactNode } from 'react';

/** Ошибка всей формы под кнопкой: нет связи, слишком много попыток. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-3.5 text-center text-[13px] text-coral-underside">
      {children}
    </p>
  );
}
