import { Icon } from '@catalog/ui';

import { SERVICE_NAME } from '@/shared/constants/service';

/** Логотип сервиса над формой: значок магазина на сиреневом и рабочее название (A10). */
export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-10 items-center justify-center rounded-[14px] bg-lilac-field">
        <Icon name="store" size={22} />
      </span>
      <span className="text-[18px] font-extrabold">{SERVICE_NAME}</span>
    </div>
  );
}
