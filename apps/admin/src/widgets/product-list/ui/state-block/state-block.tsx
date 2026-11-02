import { cx, Icon } from '@catalog/ui';
import type { ReactNode } from 'react';

type StateTone = 'search' | 'done' | 'error' | 'empty';

// значок состояния: поиск и пустая категория — на дымке, «всё хорошо» — мятный круг, ошибка — коралловая
const icons: Record<StateTone, ReactNode> = {
  search: (
    <span className="mx-auto flex size-16 items-center justify-center rounded-[22px] bg-chip-haze">
      <Icon name="search" size={28} strokeWidth={2.2} />
    </span>
  ),
  empty: (
    <span className="mx-auto flex size-16 items-center justify-center rounded-[22px] bg-chip-haze">
      <Icon name="tag" size={28} strokeWidth={2.2} />
    </span>
  ),
  done: (
    <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-mint text-mint-ink">
      <Icon name="check" size={30} strokeWidth={3} />
    </span>
  ),
  error: (
    <span className="mx-auto flex size-16 items-center justify-center rounded-[22px] bg-[#ffe8e0] text-coral-underside">
      <Icon name="warning" size={28} strokeWidth={2.2} />
    </span>
  ),
};

/**
 * Пустое или служебное состояние списка (доска AdminProductsStates): значок, заголовок, пояснение и кнопка.
 * На телефоне — под вкладками, на компьютере — внутри карточки таблицы.
 */
export function StateBlock({
  tone,
  title,
  text,
  action,
  className,
}: {
  tone: StateTone;
  title: ReactNode;
  text: ReactNode;
  action?: { label: ReactNode; onClick: () => void; dark?: boolean };
  className?: string;
}) {
  return (
    <div className={cx('text-center', className)}>
      {icons[tone]}
      <div className="mt-[18px] text-[20px] font-extrabold">{title}</div>
      <p className="mt-2 text-[15px] leading-normal text-ink-soft">{text}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cx(
            'mt-5 inline-flex h-12 items-center justify-center rounded-pill px-[22px] text-[15px] font-bold',
            action.dark
              ? 'bg-ink-night text-white shadow-press-ink hover:bg-ink-hover'
              : 'bg-chip-haze text-ink-night hover:bg-haze-hover',
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
