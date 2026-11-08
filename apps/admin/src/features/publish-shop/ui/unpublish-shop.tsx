import { unpublishShopMutation } from '@catalog/contract/query';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { applyShop } from '@/entities/shop';
import { useFormMessages } from '@/shared/hooks';
import { ConfirmSheet } from '@/shared/ui';

/**
 * «Снять» в карточке витрины (раздел «Магазин», макет AdminPhone2, экран 8) с подтверждением — в макете его нет,
 * сделано по образцу «Удалить товар?». Сняли — остаёмся на месте, карточка показывает черновик, а страница —
 * сообщение «Витрина скрыта» (`onDone`; UX-аудит, U4).
 */
export function UnpublishShop({ className, onDone }: { className?: string; onDone: () => void }) {
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
                void applyShop(queryClient, shop).then(onDone);
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
