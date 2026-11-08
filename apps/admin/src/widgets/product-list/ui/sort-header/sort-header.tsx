import { cx, Icon } from '@catalog/ui';
import type { ReactNode } from 'react';

/**
 * Заголовок колонки, по которой можно упорядочить таблицу (UX-аудит, E3; макета нет): нажатие меняет порядок,
 * значок виден всегда: у текущей колонки — стрелка направления (сиреневая), у остальных — двойная стрелка «можно
 * упорядочить», темнеет при наведении. `hint` — что сделает нажатие.
 */
export function SortHeader({
  direction,
  hint,
  onClick,
  children,
}: {
  direction: 'asc' | 'desc' | null;
  hint: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <span role="columnheader" aria-sort={direction ? (direction === 'asc' ? 'ascending' : 'descending') : undefined}>
      <button
        type="button"
        title={hint}
        onClick={onClick}
        className={cx(
          'group -mx-1.5 -my-1 inline-flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-chip-haze hover:text-ink-night',
          direction && 'text-ink-night',
        )}
      >
        {children}
        <Icon
          name={direction === 'asc' ? 'arrow-up' : direction === 'desc' ? 'arrow-down' : 'sort'}
          size={14}
          strokeWidth={2.4}
          className={cx(
            'flex-none',
            direction ? 'text-iris' : 'text-ink-muted/70 group-hover:text-ink-night group-focus-visible:text-ink-night',
          )}
        />
      </button>
    </span>
  );
}
