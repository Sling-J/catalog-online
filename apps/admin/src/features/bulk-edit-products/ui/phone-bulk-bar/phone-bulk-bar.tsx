import { Icon, type IconName } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { Suspense, useState, type ReactNode } from 'react';

import { useBulkProducts } from '@/features/bulk-edit-products/hooks';

import { CategorySheet } from './category-sheet';

/**
 * Панель действий выбора на телефоне — тёмная, на месте нижнего меню (доска AdminProductsStates, экраны 1–2):
 * «Скрыть», «Показать», «Категория» (шторка выбора категории). После действия выбор снимается.
 */
export function PhoneBulkBar({
  productIds,
  onClear,
  onDone,
}: {
  productIds: string[];
  onClear: () => void;
  onDone: (message: string) => void;
}) {
  const { t } = useLingui();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { run, pending } = useBulkProducts(productIds, (message) => {
    setSheetOpen(false);
    onClear();
    onDone(message);
  });

  const action = (icon: IconName, label: ReactNode, onClick: () => void) => (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className="flex h-14 flex-1 flex-col items-center justify-center gap-[3px] rounded-[18px] bg-white/14 text-[12px] font-bold text-white"
    >
      <Icon name={icon} size={22} />
      {label}
    </button>
  );

  return (
    <>
      <div
        role="toolbar"
        aria-label={t`Действия с выбранными`}
        className="fixed inset-x-0 bottom-0 z-30 flex gap-1 rounded-t-[26px] bg-ink-night px-2.5 pt-2 pb-[calc(20px+env(safe-area-inset-bottom))] lg:hidden"
      >
        {action('eye-off', <Trans>Скрыть</Trans>, () => run({ action: 'hide' }))}
        {action('eye', <Trans>Показать</Trans>, () => run({ action: 'show' }))}
        {action('tag', <Trans>Категория</Trans>, () => setSheetOpen(true))}
      </div>
      <Suspense>
        <CategorySheet
          open={sheetOpen}
          count={productIds.length}
          pending={pending}
          onClose={() => setSheetOpen(false)}
          onPick={(categoryId) => run({ action: 'set_category', categoryId })}
        />
      </Suspense>
    </>
  );
}
