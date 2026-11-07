import { unpublishShopMutation } from '@catalog/contract/query';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { applyShop } from '@/entities/shop';
import { useFormMessages } from '@/shared/hooks';
import { ConfirmSheet } from '@/shared/ui';

/**
 * «Снять» в карточке витрины (раздел «Магазин», макет AdminPhone2, экран 8) с подтверждением — в макете его нет,
 * сделано по образцу «Удалить товар?». Сняли — витрина скрыта, карточка показывает черновик.
 */
export function UnpublishShop({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const messages = useFormMessages();
  const [asking, setAsking] = useState(false);
  const unpublish = useMutation(unpublishShopMutation());
  return (
    <>
      <button type="button" onClick={() => setAsking(true)} className={className}>
        <Trans>Снять</Trans>
      </button>
      <ConfirmSheet
        open={asking}
        title={<Trans>Снять витрину с публикации?</Trans>}
        text={
          unpublish.isError ? (
            <span className="text-coral-underside">{messages.failed}</span>
          ) : (
            <Trans>Покупатели по ссылке увидят «Каталог скрыт». Опубликовать снова можно в любой момент.</Trans>
          )
        }
        confirm={<Trans>Снять</Trans>}
        cancel={<Trans>Оставить</Trans>}
        pending={unpublish.isPending}
        onConfirm={() =>
          unpublish.mutate(
            {},
            {
              onSuccess: (shop) => {
                setAsking(false);
                void applyShop(queryClient, shop);
              },
            },
          )
        }
        onClose={() => {
          setAsking(false);
          unpublish.reset();
        }}
      />
    </>
  );
}
