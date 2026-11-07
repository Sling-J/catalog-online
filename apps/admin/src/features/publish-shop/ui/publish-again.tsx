import { publishShopMutation } from '@catalog/contract/query';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { applyShop } from '@/entities/shop';
import { problemCode } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';

/**
 * «Опубликовать» в карточке снятой витрины (раздел «Магазин»; в макете нет — сделано в коде). Опубликовали —
 * карточка снова «Видна всем». Нельзя (нет товаров, почта не подтверждена) — на главную с чек-листом, там причина.
 */
export function PublishAgain({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const messages = useFormMessages();
  const publish = useMutation(publishShopMutation());
  return (
    <>
      <button
        type="button"
        disabled={publish.isPending}
        className={className}
        onClick={() =>
          publish.mutate(
            {},
            {
              onSuccess: (shop) => void applyShop(queryClient, shop),
              onError: (error) => {
                if (problemCode(error) === 'shop_not_ready') void navigate({ to: '/' });
              },
            },
          )
        }
      >
        <Trans>Опубликовать</Trans>
      </button>
      {publish.isError && problemCode(publish.error) !== 'shop_not_ready' && (
        <p role="alert" className="mt-2.5 w-full text-[13px] text-coral-underside">
          {messages.failed}
        </p>
      )}
    </>
  );
}
