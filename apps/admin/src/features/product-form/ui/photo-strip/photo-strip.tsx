import type { Photo } from '@catalog/contract';
import { cx, Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

/**
 * Фото товара на телефоне строкой: обложка в жёлтой рамке, дальше остальные и пунктирная плитка «Фото»
 * (макет AdminPhone, экран 3: 104 px) или «Ещё фото» с камерой (макет AdminPhone2, экран 7: 96 px).
 * Загрузка и порядок — T-307: пока плитка только показывает, куда они встанут.
 */
export function PhotoStrip({ photos, size }: { photos: Photo[]; size: 'edit' | 'new' }) {
  const box = size === 'edit' ? 'size-[104px]' : 'size-24';
  const ready = photos.filter((photo) => photo.image);
  return (
    // прокрутка вбок обрезала бы жёлтую рамку обложки снизу — под ней 3 px
    <div className="flex gap-2 overflow-x-auto px-4 pt-3.5 pb-[3px]">
      {ready.map((photo, index) => (
        <img
          key={photo.id}
          src={photo.image!.sizes['320']}
          alt=""
          className={cx(
            'flex-none rounded-thumb bg-chip-haze object-cover',
            box,
            index === 0 && 'shadow-[0_0_0_3px_var(--color-sun)]',
          )}
        />
      ))}
      {/* рамка снаружи размера, как в макете (content-box) */}
      <span
        className={cx(
          'box-content flex flex-none flex-col items-center justify-center gap-1 rounded-thumb border-[1.5px] border-dashed border-[#c9c3e3] bg-[#f6f5fb] text-[12px] font-semibold text-ink-quiet',
          box,
        )}
      >
        {size === 'edit' ? (
          <>
            <Icon name="plus" size={22} />
            <Trans>Фото</Trans>
          </>
        ) : (
          <>
            <Icon name="camera" size={22} />
            {ready.length > 0 ? <Trans>Ещё фото</Trans> : <Trans>Фото</Trans>}
          </>
        )}
      </span>
    </div>
  );
}
