import { Button, Icon, Sheet, useIsDesktop } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import type { PhotoTile } from '../../types';

/**
 * Что можно сделать с фото по нажатию (макета нет, по образцу шторки «Перенести в категорию»): шторка снизу на
 * телефоне, окно по центру на компьютере. «Сделать обложкой» — не первому; «Загрузить ещё раз» — тому, что не
 * загрузилось; «Удалить фото» — всем, у сохранённого сразу удаляет с товара.
 */
export function PhotoActions({
  tile,
  isCover,
  onClose,
  onMakeCover,
  onRetry,
  onRemove,
}: {
  tile: PhotoTile | undefined;
  isCover: boolean;
  onClose: () => void;
  onMakeCover: () => void;
  onRetry: () => void;
  onRemove: () => Promise<void>;
}) {
  const isDesktop = useIsDesktop();
  const [pending, setPending] = useState(false);
  const remove = () => {
    setPending(true);
    onRemove()
      .then(onClose, () => onClose())
      .finally(() => setPending(false));
  };
  const src = tile && (tile.image?.sizes['640'] ?? tile.preview);
  return (
    <Sheet
      open={tile !== undefined}
      onClose={onClose}
      title={isCover ? <Trans>Обложка</Trans> : <Trans>Фото</Trans>}
      placement={isDesktop ? 'center' : 'bottom'}
    >
      {src && <img src={src} alt="" className="-mt-[9px] size-24 rounded-thumb bg-chip-haze object-cover" />}
      <div className="mt-[18px] flex flex-col gap-2.5">
        {tile?.sortable && !isCover && tile.state !== 'upload-failed' && (
          <Button
            variant="soft"
            size="form"
            block
            onClick={() => {
              onMakeCover();
              onClose();
            }}
          >
            <Trans>Сделать обложкой</Trans>
          </Button>
        )}
        {tile?.state === 'upload-failed' && (
          <Button
            variant="dark"
            size="form"
            block
            onClick={() => {
              onRetry();
              onClose();
            }}
          >
            <Icon name="sync" size={18} />
            <Trans>Загрузить ещё раз</Trans>
          </Button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={remove}
          className="inline-flex h-[52px] items-center justify-center gap-1.5 text-[15px] font-semibold text-coral-underside hover:underline disabled:opacity-50"
        >
          <Icon name="trash" size={18} />
          <Trans>Удалить фото</Trans>
        </button>
      </div>
    </Sheet>
  );
}
