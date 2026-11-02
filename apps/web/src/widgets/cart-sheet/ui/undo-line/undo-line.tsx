import { Trans } from '@lingui/react/macro';

/**
 * На месте убранной строки: «Куртка — убрано · Вернуть». Видна UNDO_MS (модель корзины), потом исчезает —
 * на случай, если товар убрали случайно (макет «Витрина — корзина», 2026-11-02).
 */
export function UndoLine({ name, onRestore }: { name: string; onRestore: () => void }) {
  return (
    <li
      role="status"
      className="flex h-14 items-center justify-between gap-3 rounded-field bg-[#f6f5fb] px-3.5 text-[14px] text-ink-quiet lg:rounded-[14px]"
    >
      <span className="truncate">
        <Trans>{name} — убрано</Trans>
      </span>
      <button type="button" onClick={onRestore} className="flex-none py-1.5 font-bold text-iris hover:underline">
        <Trans>Вернуть</Trans>
      </button>
    </li>
  );
}
