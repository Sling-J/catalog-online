import { Button, Sheet } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import type { ShopInfoForm } from '../../hooks';
import { DayRows } from '../day-rows';

// на телефоне колонки уже: день, открытие, тире, закрытие, переключатель
const GRID = 'minmax(0,1fr) 68px 8px 68px 46px';

/**
 * Правка графика на телефоне (в макете нет — сделано в коде): шторка с теми же днями, что на компьютере.
 * Правки идут в форму — сохраняются вместе со всем «Готово» в шапке экрана.
 */
export function ScheduleSheet({
  form,
  timezone,
  open,
  onClose,
}: {
  form: ShopInfoForm;
  timezone: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={<Trans>График работы</Trans>}>
      <DayRows form={form} timezone={timezone} grid={GRID} />
      <Button variant="dark" size="form" block onClick={onClose} className="mt-4">
        <Trans>Готово</Trans>
      </Button>
    </Sheet>
  );
}
