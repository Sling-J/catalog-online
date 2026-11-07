import { useIsDesktop } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useStore } from '@tanstack/react-form';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';

import { previewFromDraft, useShopInfoForm } from '@/features/edit-shop-info';
import { PreviewPanel } from '@/features/storefront-preview';
import { shopQueryOptions, storefrontUrl } from '@/entities/shop';
import { useLeaveGuard } from '@/shared/hooks';
import { LeaveConfirm, submitForm, Toast, useIsDirty } from '@/shared/ui';

import type { ShopInfoView } from '../types';

import { DeskShopInfo } from './desk-shop-info';
import { PhoneShopInfo } from './phone-shop-info';

/**
 * «О магазине» (FR-A9): телефон — макет AdminPhone2, экран 9; компьютер — AdminDesk2, экраны 7–8. Сохраняется
 * только изменённое; логотип — сразу. Телефон после «Готово» возвращается в «Магазин», компьютер остаётся и
 * говорит «Сохранено». Превью витрины — по кнопке, панелью справа (A7), с несохранёнными правками.
 */
export function ShopInfoPage() {
  const { t } = useLingui();
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const { data: shop } = useSuspenseQuery(shopQueryOptions());
  const [toast, setToast] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const hideToast = useCallback(() => setToast(null), []);
  const closePreview = useCallback(() => setPreviewOpen(false), []);

  const form = useShopInfoForm({
    shop,
    onSaved: (changed) => {
      if (!isDesktop) {
        guard.allow();
        void navigate({ to: '/shop' });
      } else if (changed) setToast(t`Сохранено`);
    },
  });
  const guard = useLeaveGuard(useIsDirty(form));
  const values = useStore(form.store, (state) => state.values);
  const url = shop.subdomain ? storefrontUrl(shop.subdomain, window.location.origin) : null;

  const view: ShopInfoView = {
    shop,
    form,
    onSubmit: (event) => {
      event.preventDefault();
      void submitForm(form);
    },
  };
  return (
    <>
      {isDesktop ? (
        <DeskShopInfo {...view} previewOpen={previewOpen} onTogglePreview={() => setPreviewOpen((open) => !open)} />
      ) : (
        <PhoneShopInfo {...view} />
      )}
      {isDesktop && url && (
        <PreviewPanel open={previewOpen} storefrontUrl={url} draft={previewFromDraft(values)} onClose={closePreview} />
      )}
      <LeaveConfirm guard={guard} text={<Trans>Правки в «О магазине» пропадут.</Trans>} />
      <Toast message={toast} onHide={hideToast} />
    </>
  );
}
