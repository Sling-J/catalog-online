import { cx, Icon } from '@catalog/ui';
import type { ReactNode } from 'react';

import { whatsappLink } from '@/entities/shop';

/**
 * «Спросить в WhatsApp» / «Спросить о поступлении»: ссылка на чат магазина с готовым текстом (S9).
 * `button` — мятная кнопка с иконкой, `link` — текстовая ссылка под главной кнопкой.
 */
export function AskInWhatsApp({
  phone,
  message,
  variant = 'button',
  block,
  className,
  children,
}: {
  phone: string;
  message: string;
  variant?: 'button' | 'link';
  className?: string;
  /** Растянуть на всю ширину — главная кнопка закреплена внизу экрана. */
  block?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={whatsappLink(phone, message)}
      target="_blank"
      rel="noreferrer"
      className={cx(
        'inline-flex items-center justify-center gap-2 font-sans press',
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris',
        variant === 'button'
          ? 'h-[52px] rounded-pill bg-mint px-[22px] text-[15px] font-bold text-mint-ink shadow-press-mint hover:bg-mint-hover lg:h-[54px] lg:px-6 lg:text-[16px]'
          : 'h-11 rounded-pill px-4 text-[15px] font-semibold text-iris hover:underline',
        block && 'w-full',
        className,
      )}
    >
      {variant === 'button' && <Icon name="whatsapp" size={22} />}
      {children}
    </a>
  );
}
