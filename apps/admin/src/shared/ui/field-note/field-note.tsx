import type { ReactNode } from 'react';

/** Серая пометка у подписи поля: «правится только здесь», «необязательно», «для всех размеров». */
export function FieldNote({ children }: { children: ReactNode }) {
  return <span className="text-ink-muted">{children}</span>;
}
