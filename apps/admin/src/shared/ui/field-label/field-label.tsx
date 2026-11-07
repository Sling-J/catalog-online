import type { ReactNode } from 'react';

/** Подпись поля редактора: 13 px, справа — пометка («из Excel», «необязательно»), до поля 6 px. */
export function FieldLabel({ htmlFor, note, children }: { htmlFor?: string; note?: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-1.5 flex justify-between text-[13px] font-semibold text-ink-quiet">
      <label htmlFor={htmlFor}>{children}</label>
      {note}
    </div>
  );
}
