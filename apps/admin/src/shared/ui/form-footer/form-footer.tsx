import type { ReactNode } from 'react';

/** Нижняя строка формы входа со ссылкой («Уже есть каталог? Войти»). Ссылки в ней — `font-bold text-iris`. */
export function FormFooter({ children }: { children: ReactNode }) {
  return <p className="mt-10 text-center text-[15px]">{children}</p>;
}
