import { cx, Icon } from '@catalog/ui';

export type StateBadgeKind = 'mail' | 'ok' | 'warn';

// фон и значок как в макетах: письмо на сиреневом, галочка на мяте, предупреждение на светлом коралле
const kinds = {
  mail: { bg: 'bg-lilac-mist', icon: <Icon name="mail" size={30} strokeWidth={2} /> },
  ok: { bg: 'bg-mint text-mint-ink', icon: <Icon name="check" size={32} strokeWidth={2.6} /> },
  warn: { bg: 'bg-[#ffe9e1] text-coral-underside', icon: <Icon name="warning" size={30} strokeWidth={2.2} /> },
} as const;

/** Значок экрана-состояния: 64 px на телефоне, 72 px на компьютере. */
export function StateBadge({ kind, className }: { kind: StateBadgeKind; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'flex size-16 items-center justify-center rounded-[20px] lg:size-[72px]',
        kinds[kind].bg,
        className,
      )}
    >
      {kinds[kind].icon}
    </span>
  );
}
