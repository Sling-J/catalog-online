import { publishShopMutation } from '@catalog/contract/query';
import { Button } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';

import { applyShop } from '@/entities/shop';
import { useFormMessages } from '@/shared/hooks';

/**
 * «Опубликовать витрину» с подписью под кнопкой (A16). Нельзя — неактивная кнопка и причина: нет товаров
 * или не подтверждена почта. Опубликовали — сразу «Товары» (A2).
 */
export function PublishButton({
  blocker,
  withoutPhotos,
}: {
  blocker: 'products' | 'email' | null;
  /** Есть товары без фото — подсказка «Можно и без фото». */
  withoutPhotos: boolean;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const messages = useFormMessages();
  const [failed, setFailed] = useState(false);
  const publish = useMutation(publishShopMutation());

  const note: ReactNode = failed ? (
    messages.failed
  ) : blocker === 'products' ? (
    <Trans>Сначала добавьте товары</Trans>
  ) : blocker === 'email' ? (
    <Trans>Сначала подтвердите почту</Trans>
  ) : withoutPhotos ? (
    <Trans>Можно и без фото — добавите потом</Trans>
  ) : null;

  return (
    <>
      {blocker ? (
        // неактивная — дымка и приглушённый текст, как в макете (у Button иначе текст ink-quiet)
        <button
          type="button"
          disabled
          className="flex h-[52px] w-full items-center justify-center rounded-pill bg-chip-haze px-[22px] text-[15px] font-bold text-ink-muted"
        >
          <Trans>Опубликовать витрину</Trans>
        </button>
      ) : (
        <Button
          variant="primary"
          size="form"
          block
          disabled={publish.isPending}
          onClick={() => {
            setFailed(false);
            publish.mutate(
              {},
              {
                onSuccess: (shop) =>
                  void applyShop(queryClient, shop).then(() => navigate({ to: '/products', replace: true })),
                onError: () => setFailed(true),
              },
            );
          }}
        >
          <Trans>Опубликовать витрину</Trans>
        </Button>
      )}
      {note && (
        <p
          role={failed ? 'alert' : undefined}
          className={
            failed
              ? 'mt-2.5 text-center text-[13px] text-coral-underside'
              : 'mt-2.5 text-center text-[13px] text-ink-muted'
          }
        >
          {note}
        </p>
      )}
    </>
  );
}
