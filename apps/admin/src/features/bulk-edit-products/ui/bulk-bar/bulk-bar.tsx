import { cx, Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { Suspense, useEffect, useRef, useState } from 'react';

import { useBulkProducts } from '@/features/bulk-edit-products/hooks';

import { CategoryMenu } from './category-menu';

/**
 * Тёмная полоса массовых действий над таблицей (макет AdminDesk, экран 1): «Выбрано N», «Скрыть», «Показать»,
 * «Сменить категорию» (список категорий — доска AdminProductsStates, экран 8), «Снять выбор».
 * После действия выбор снимается, а страница показывает сообщение (`onDone`).
 */
export function BulkBar({
  productIds,
  onClear,
  onDone,
}: {
  productIds: string[];
  onClear: () => void;
  onDone: (message: string) => void;
}) {
  const { t } = useLingui();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { run, pending } = useBulkProducts(productIds, (message) => {
    setMenuOpen(false);
    onClear();
    onDone(message);
  });

  // список категорий закрывается кликом мимо и Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const pill = 'rounded-pill bg-white/14 px-3.5 py-2 hover:bg-white/24';
  return (
    <div className="flex items-center gap-3.5 rounded-t-[24px] bg-ink-night px-[18px] py-3 text-[14px] font-semibold text-white">
      <button
        type="button"
        onClick={onClear}
        aria-label={t`Снять выбор`}
        className="flex size-5 flex-none items-center justify-center rounded-md bg-sun text-ink-night"
      >
        <Icon name="check" size={14} strokeWidth={3} />
      </button>
      <span className="flex-1">
        <Trans>Выбрано {productIds.length}</Trans>
      </span>
      <button type="button" disabled={pending} onClick={() => run({ action: 'hide' })} className={pill}>
        <Trans>Скрыть</Trans>
      </button>
      <button type="button" disabled={pending} onClick={() => run({ action: 'show' })} className={pill}>
        <Trans>Показать</Trans>
      </button>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          disabled={pending}
          onClick={() => setMenuOpen((open) => !open)}
          className={cx(pill, menuOpen && 'bg-white/32')}
        >
          <Trans>Сменить категорию</Trans>
        </button>
        {menuOpen && (
          <Suspense>
            <CategoryMenu
              count={productIds.length}
              onPick={(categoryId) => run({ action: 'set_category', categoryId })}
            />
          </Suspense>
        )}
      </div>
      <button type="button" onClick={onClear} className="opacity-70 hover:opacity-100">
        <Trans>Снять выбор</Trans>
      </button>
    </div>
  );
}
