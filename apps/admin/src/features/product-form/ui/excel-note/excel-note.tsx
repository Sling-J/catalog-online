import { Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';

import type { ProductForm } from '../../hooks';
import type { ExcelField } from '../../types';
import { ExcelMark } from '../excel-mark';

/**
 * Подпись поля карточки про Excel (макета нет, решение основателя 2026-11-10): поле ведёт Excel — пометка «из Excel»;
 * пометку сняла ручная правка, а товар ведёт импорт — ссылка «брать из Excel», которая возвращает поле под
 * следующий импорт (сохраняется вместе с карточкой). Правка руками после этого снова снимет пометку.
 */
export function ExcelNote({ form, field, available }: { form: ProductForm; field: ExcelField; available: boolean }) {
  const { t } = useLingui();
  return (
    <form.Field name="excelFields">
      {({ state, handleChange }) => {
        if (state.value.includes(field)) return <ExcelMark />;
        if (!available) return null;
        return (
          <button
            type="button"
            className="inline-flex items-center gap-1 self-start font-semibold text-ink-quiet hover:text-iris"
            title={t`Следующий импорт перезапишет поле значением из файла`}
            onClick={() => handleChange([...state.value, field])}
          >
            <Icon name="sync" size={13} strokeWidth={2.2} />
            <Trans>брать из Excel</Trans>
          </button>
        );
      }}
    </form.Field>
  );
}
