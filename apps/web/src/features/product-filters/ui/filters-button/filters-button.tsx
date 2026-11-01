import { useLingui } from '@lingui/react/macro';

import { Icon } from '@/shared/ui';

/** Квадратная кнопка рядом с поиском; со счётчиком включённых фильтров. */
export function FiltersButton({ count, onClick }: { count: number; onClick: () => void }) {
  const { t } = useLingui();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count > 0 ? t`Фильтры, выбрано: ${count}` : t`Фильтры`}
      className="relative flex size-[46px] flex-none items-center justify-center rounded-field bg-chip-haze text-ink-night"
    >
      <Icon name="sliders" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-pill bg-[#3b2fd9] px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
