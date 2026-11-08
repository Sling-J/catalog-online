import { cx, Icon } from '@catalog/ui';
import { Link, type LinkProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';

/**
 * Пункт чек-листа (макет AdminPhone, экран 1): кружок — мятный с галочкой или пунктир, справа действие.
 * `optional` — необязательный пункт (UX-аудит, L1): пометка у названия, в счёт готовности не входит.
 */
export function ChecklistStep({
  done,
  muted,
  optional,
  title,
  sub,
  action,
  extra,
}: {
  done?: boolean;
  muted?: boolean;
  optional?: ReactNode;
  title: ReactNode;
  sub: ReactNode;
  action?: { to: LinkProps['to']; label: ReactNode };
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] bg-white p-3.5 shadow-[0_1px_0_#eceaf5]">
      {done ? (
        <span className="flex size-8 flex-none items-center justify-center rounded-full bg-mint text-mint-ink">
          <Icon name="check" size={18} strokeWidth={3} />
        </span>
      ) : (
        <span className="box-content size-8 flex-none rounded-full border-2 border-dashed border-[#c9c3e3]" />
      )}
      <div className="min-w-0 flex-1">
        <div className={cx('text-[15px] font-bold', (done || muted) && 'text-ink-quiet')}>
          {title}
          {optional && (
            <span className="ml-1.5 inline-flex h-5 items-center rounded-pill bg-chip-haze px-2 align-[2px] text-[11px] font-semibold text-ink-quiet">
              {optional}
            </span>
          )}
        </div>
        <div className="text-[13px] text-ink-quiet">{sub}</div>
      </div>
      {action && (
        <Link to={action.to} className="flex-none text-[14px] font-bold text-iris">
          {action.label}
        </Link>
      )}
      {extra}
    </div>
  );
}
