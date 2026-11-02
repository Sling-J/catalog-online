import { cx, type StockLevel } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

const tones: Record<StockLevel, string> = { in: 'text-stock-in', low: 'text-stock-low', out: 'text-stock-out' };

/** Остаток товара: «24 шт.», «мало: 3 шт.» (в таблице — «мало: 3»), «нет». */
export function StockText({
  total,
  level,
  short,
  className,
}: {
  total: number;
  level: StockLevel;
  /** Таблица компьютера: «мало: 3» без «шт.». */
  short?: boolean;
  className?: string;
}) {
  return (
    <span className={cx('font-semibold', tones[level], className)}>
      {level === 'out' ? (
        <Trans>нет</Trans>
      ) : level === 'low' ? (
        short ? (
          <Trans>мало: {total}</Trans>
        ) : (
          <Trans>мало: {total} шт.</Trans>
        )
      ) : (
        <Trans>{total} шт.</Trans>
      )}
    </span>
  );
}
