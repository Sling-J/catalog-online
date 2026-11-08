import type { Shop } from '@catalog/contract';
import { publishShopMutation } from '@catalog/contract/query';
import { Button } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { applyShop, type PublishBlocker } from '@/entities/shop';
import { useFormMessages } from '@/shared/hooks';

/**
 * «Опубликовать витрину» — одна на всю админку (главная до запуска и карточка в «Магазине»), ведёт себя везде
 * одинаково (UX-аудит, L4): опубликовали — остаёмся на месте, страница показывает момент успеха (`onPublished`).
 * Нельзя — кнопка неактивна, а под ней все причины сразу (L2), а не только первая.
 */
export function PublishButton({
  blockers,
  withoutPhotos,
  onPublished,
}: {
  blockers: PublishBlocker[];
  /** Есть товары без фото — подсказка «Можно и без фото». */
  withoutPhotos: boolean;
  onPublished: (shop: Shop) => void;
}) {
  const queryClient = useQueryClient();
  const messages = useFormMessages();
  const [failed, setFailed] = useState(false);
  const publish = useMutation(publishShopMutation());

  const reasons: Record<PublishBlocker, ReactNode> = {
    products: <Trans>добавьте товары</Trans>,
    email: <Trans>подтвердите почту</Trans>,
  };

  if (blockers.length > 0) {
    return (
      <>
        {/* неактивная — дымка и приглушённый текст, как в макете (у Button иначе текст ink-quiet) */}
        <button
          type="button"
          disabled
          className="flex h-[52px] w-full items-center justify-center rounded-pill bg-chip-haze px-[22px] text-[15px] font-bold text-ink-muted"
        >
          <Trans>Опубликовать витрину</Trans>
        </button>
        <p className="mt-2.5 text-center text-[13px] text-ink-muted">
          <Trans>Чтобы опубликовать,</Trans>{' '}
          {blockers.map((blocker, index) => (
            <span key={blocker}>
              {index > 0 && (index === blockers.length - 1 ? <Trans> и </Trans> : ', ')}
              {reasons[blocker]}
            </span>
          ))}
        </p>
      </>
    );
  }

  return (
    <>
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
              onSuccess: (shop) => void applyShop(queryClient, shop).then(() => onPublished(shop)),
              onError: () => setFailed(true),
            },
          );
        }}
      >
        <Trans>Опубликовать витрину</Trans>
      </Button>
      {failed ? (
        <p role="alert" className="mt-2.5 text-center text-[13px] text-coral-underside">
          {messages.failed}
        </p>
      ) : (
        withoutPhotos && (
          <p className="mt-2.5 text-center text-[13px] text-ink-muted">
            <Trans>Можно и без фото — добавите потом</Trans>
          </p>
        )
      )}
    </>
  );
}
