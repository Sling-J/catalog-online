import { Trans } from '@lingui/react/macro';

import type { ShopInfoForm } from '../../hooks';
import { DayRows } from '../day-rows';

// колонки макета: день 128 px, открытие, тире, закрытие, переключатель
const GRID = '128px 1fr 16px 1fr 46px';

/** «График работы» на компьютере — карточка справа от сведений (макет AdminDesk2, экран 7). */
export function ScheduleCard({ form, timezone }: { form: ShopInfoForm; timezone: string }) {
  return (
    <section>
      <h2 className="text-[15px] font-bold">
        <Trans>График работы</Trans>
      </h2>
      <div className="mt-2 rounded-[22px] bg-white px-[18px] py-2.5 shadow-[0_1px_0_#eceaf5,0_6px_16px_rgb(40_30_110/0.05)]">
        <DayRows form={form} timezone={timezone} grid={GRID} />
      </div>
    </section>
  );
}
