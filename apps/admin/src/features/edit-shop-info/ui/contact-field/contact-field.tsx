import { cx } from '@catalog/ui';
import type { InputHTMLAttributes, ReactNode } from 'react';

/**
 * Контакт на телефоне — поле без подписи сверху, название внутри перед значением: «WhatsApp +7 700…»,
 * «Instagram @aigerim.kids» (макет AdminPhone2, экран 9).
 */
export function ContactField({
  name,
  error,
  ...input
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> & { name: string; error?: ReactNode }) {
  return (
    // сверху 6 px, как у поля с подписью в макете (у контактов подпись пустая, отступ под ней остался)
    <div className="pt-1.5">
      <label
        className={cx(
          'flex min-h-12 items-center gap-1 rounded-field border-[1.5px] bg-white px-3.5 py-[13px] text-[15px] leading-[1.4]',
          'focus-within:border-ink-night focus-within:ring-[0.5px] focus-within:ring-ink-night focus-within:ring-inset',
          error ? 'border-coral-underside' : 'border-[#e2dff0]',
        )}
      >
        <span className="flex-none">{name}</span>
        <input
          aria-invalid={error ? true : undefined}
          className="min-w-0 flex-1 bg-transparent text-ink-night placeholder:text-ink-muted focus:outline-none"
          {...input}
        />
      </label>
      {error && <p className="mt-1.5 text-[13px] text-coral-underside">{error}</p>}
    </div>
  );
}
