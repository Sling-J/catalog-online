import type { Product } from '@catalog/contract';
import { cx, Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { ConfirmSheet, FormError } from '@/shared/ui';

import { useDeleteProduct } from '../../hooks';

/**
 * «Удалить товар» внизу карточки с подтверждением: товар пропадает из админки и с витрины вместе с вариантами и
 * фото. Удалили — `onDeleted` (обратно в «Товары»).
 */
export function DeleteProduct({
  product,
  className,
  onDeleted,
}: {
  product: Product;
  className?: string;
  onDeleted: () => void;
}) {
  const { t } = useLingui();
  const [open, setOpen] = useState(false);
  const remove = useDeleteProduct(product);
  const name = product.name;
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx(
          'inline-flex items-center gap-1.5 text-[14px] font-semibold text-coral-underside hover:underline',
        )}
      >
        <Icon name="trash" size={16} />
        <Trans>Удалить товар</Trans>
      </button>
      <ConfirmSheet
        open={open}
        title={<Trans>Удалить товар?</Trans>}
        text={<Trans>«{name}» пропадёт из админки и с витрины вместе с вариантами и фото. Вернуть не получится.</Trans>}
        confirm={<Trans>Удалить</Trans>}
        cancel={<Trans>Оставить</Trans>}
        pending={remove.isPending}
        onConfirm={() => remove.mutate(undefined, { onSuccess: onDeleted })}
        onClose={() => setOpen(false)}
      />
      {remove.isError && <FormError>{t`Не получилось удалить. Проверьте интернет и попробуйте ещё раз.`}</FormError>}
    </div>
  );
}
