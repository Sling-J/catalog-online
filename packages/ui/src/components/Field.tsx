import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

import { cx } from '../cx.js';

export type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  /** Подсказка справа от подписи: «необязательно», «из Excel». */
  note?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
};

/** Поле ввода с подписью, подсказкой и ошибкой (макеты админки: текст 15 px, подписи 13 px). Связи подписи и ошибки — через id. */
export function Field({ label, note, hint, error, className, id, ...rest }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className={cx('flex flex-col gap-1.5 font-sans', className)}>
      <div className="flex items-baseline justify-between text-[13px] font-semibold text-ink-quiet">
        <label htmlFor={inputId}>{label}</label>
        {note}
      </div>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          // как в макете: отступы 13/14, строка 1.4, рамка 1.5 px — поле 50 px
          'rounded-field border-[1.5px] bg-white px-3.5 py-[13px] text-[15px] leading-[1.4] text-ink-night',
          // фокус — рамка ink-night 2 px (DESIGN.md): к рамке добавляем полпикселя кольцом внутрь, без сдвига
          'placeholder:text-ink-muted focus:border-ink-night focus:ring-[0.5px] focus:ring-ink-night focus:ring-inset focus:outline-none',
          error ? 'border-coral-underside' : 'border-[#e2dff0]',
        )}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-[13px] text-coral-underside">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-[13px] text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
