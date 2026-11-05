import { Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

/** Пометка «из Excel»: поле перезапишет следующий импорт (макеты AdminPhone, экран 3, и AdminDesk, экран 2). */
export function ExcelMark() {
  return (
    // сверху, как подпись поля (у `Field` строка подписи выровнена по базовой линии)
    <span className="inline-flex items-center gap-1 self-start font-semibold text-iris">
      <Icon name="sync" size={13} strokeWidth={2.2} />
      <Trans>из Excel</Trans>
    </span>
  );
}
