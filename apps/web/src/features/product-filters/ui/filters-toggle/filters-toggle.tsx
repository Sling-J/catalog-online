import { cx, Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

/**
 * Кнопка «Фильтры» в строке категорий на компьютере: открывает и закрывает панель фильтров, «Фильтры · N».
 * Пока панель открыта — тёмная рамка и стрелка вверх (макет, вариант Г).
 */
export function FiltersToggle({ count, expanded, onClick }: { count: number; expanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={cx(
        'inline-flex h-10 items-center gap-2 rounded-pill border-[1.5px] bg-white px-4 text-[14px] font-semibold text-ink-night focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris',
        expanded ? 'border-ink-night' : 'border-line hover:border-line-hover',
      )}
    >
      <Icon name="sliders" size={16} />
      {count > 0 ? <Trans>Фильтры · {count}</Trans> : <Trans>Фильтры</Trans>}
      {expanded && <Icon name="chevron-down" size={14} strokeWidth={2.4} className="rotate-180" />}
    </button>
  );
}
