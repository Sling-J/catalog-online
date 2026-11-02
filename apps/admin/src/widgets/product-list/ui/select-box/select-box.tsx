import { cx, Icon } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';

/** Квадрат выбора строки (макет AdminDesk, экран 1): пустой с рамкой или тёмный с галочкой. */
export function SelectBox({ selected, label, onToggle }: { selected: boolean; label: string; onToggle: () => void }) {
  const { t } = useLingui();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={t`Выбрать: ${label}`}
      onClick={(event) => {
        // строка телефона сама переключает выбор по нажатию — второй раз не нужно
        event.stopPropagation();
        onToggle();
      }}
      className={cx(
        'flex size-5 flex-none items-center justify-center rounded-md',
        selected ? 'bg-ink-night text-white' : 'border-[1.5px] border-[#c9c3e3] bg-white hover:border-ink-quiet',
      )}
    >
      {selected && <Icon name="check" size={14} strokeWidth={3} />}
    </button>
  );
}
