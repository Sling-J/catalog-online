import type { Import } from '@catalog/contract';
import { Icon } from '@catalog/ui';
import { Plural, Trans } from '@lingui/react/macro';

import { ButtonLink } from '@/shared/ui';

import { StatTile } from '../stat-tile';
import { TextAction } from '../text-action';

type Result = NonNullable<Import['result']>;

/**
 * Шаг «Готово» (FR-A3, макета нет): мятная галочка, что сделано — новые, обновлённые, обнулённые и пропущенные
 * строки плитками как на проверке, «К товарам» и «Загрузить ещё файл». По образцу «Фото добавлены» быстрого режима.
 */
export function ResultState({ item, onAgain }: { item: Import & { result: Result }; onAgain: () => void }) {
  const { result } = item;
  return (
    <div className="mx-auto mt-8 flex max-w-[430px] flex-col items-center text-center lg:mt-14">
      <span className="flex size-16 items-center justify-center rounded-full bg-mint text-mint-ink">
        <Icon name="check" size={30} strokeWidth={2.6} />
      </span>
      <h2 className="mt-4 text-title">
        <Trans>Товары загружены</Trans>
      </h2>
      <p className="mt-1 max-w-full truncate text-[14px] text-ink-quiet">{item.fileName}</p>
      <div className="mt-5 grid w-full grid-cols-2 gap-2 text-left">
        <StatTile
          tone="create"
          value={result.created}
          label={<Plural value={result.created} one="новый" other="новых" />}
        />
        <StatTile tone="update" value={result.updated} label={<Trans>обновлено</Trans>} />
        <StatTile tone="zeroed" value={result.zeroed} label={<Trans>обнулено</Trans>} />
        <StatTile
          tone="errors"
          value={result.skipped}
          label={<Plural value={result.skipped} one="строка с ошибкой" other="строк с ошибками" />}
        />
      </div>
      <ButtonLink to="/products" variant="dark" className="mt-6">
        <Trans>К товарам</Trans>
      </ButtonLink>
      <TextAction onClick={onAgain} className="mt-4">
        <Trans>Загрузить ещё файл</Trans>
      </TextAction>
    </div>
  );
}
