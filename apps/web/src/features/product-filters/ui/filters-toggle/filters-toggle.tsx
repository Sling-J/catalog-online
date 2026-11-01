import { Trans } from '@lingui/react/macro';

import { Icon } from '@/shared/ui';

/** Кнопка «Фильтры» в строке категорий на компьютере: раскрывает и сворачивает строку фильтров, «Фильтры · N». */
export function FiltersToggle({ count, expanded, onClick }: { count: number; expanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="inline-flex h-10 items-center gap-2 rounded-pill border-[1.5px] border-[#dad6ec] bg-white px-4 text-[14px] font-semibold text-ink-night focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris"
    >
      <Icon name="sliders" size={16} />
      {count > 0 ? <Trans>Фильтры · {count}</Trans> : <Trans>Фильтры</Trans>}
    </button>
  );
}
