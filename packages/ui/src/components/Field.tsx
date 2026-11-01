import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

import { cx } from '../cx.js';

export type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  /** Подсказка справа от подписи: «необязательно», «из Excel». */
  note?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
};

/** Поле ввода с подписью, подсказкой и ошибкой. Связи подписи и ошибки — через id. */
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
          'h-12 rounded-field bg-white px-3.5 text-body text-ink-night ring-[1.5px] ring-inset',
          'placeholder:text-ink-muted focus:ring-2 focus:ring-ink-night focus:outline-none',
          error ? 'ring-coral-underside' : 'ring-[#e2dff0]',
        )}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-caption text-coral-underside">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-caption text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
