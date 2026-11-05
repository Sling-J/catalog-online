import { Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

/** Пояснение к пометкам «из Excel» на компьютере (макет AdminDesk, экран 2). */
export function ImportNote() {
  return (
    <div className="flex items-start gap-2.5 rounded-field bg-[#ece9ff] px-3.5 py-3 text-[13px] leading-[1.45] text-[#2a2290]">
      <Icon name="sync" size={16} strokeWidth={2.2} className="text-iris" />
      <span>
        <Trans>
          Поля с пометкой «из Excel» обновятся при следующем импорте. Фото, описание и видимость импорт не трогает.
        </Trans>
      </span>
    </div>
  );
}
