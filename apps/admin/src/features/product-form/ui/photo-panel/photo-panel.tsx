import type { Photo } from '@catalog/contract';
import { cx, Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import { CoverBadge } from './cover-badge';

/**
 * Фото на компьютере: обложка с плашкой «Обложка», под ней остальные и «Добавить» (макет AdminDesk, экран 2:
 * 420 px) либо поле «Добавьте фото или перетащите сюда» (макет AdminDesk2, экран 6: 340 px).
 * Загрузка и порядок — T-307: пока плитки только показывают, куда встанут фото.
 */
export function PhotoPanel({ photos, size }: { photos: Photo[]; size: 'edit' | 'new' }) {
  const [cover, ...rest] = photos.filter((photo) => photo.image);
  const edit = size === 'edit';
  return (
    <div className={cx('flex-none', edit ? 'w-[420px]' : 'w-[340px]')}>
      {cover && (
        // в макете обложка — строчная картинка, под ней 4 px строки
        <div className="relative pb-1">
          <img
            src={cover.image!.sizes['1280']}
            alt=""
            className={cx('rounded-[24px] bg-chip-haze object-cover', edit ? 'size-[420px]' : 'size-[340px]')}
          />
          <CoverBadge />
        </div>
      )}
      {edit ? (
        <>
          <div className={cx('flex flex-wrap gap-2', cover && 'mt-2')}>
            {rest.map((photo) => (
              <img
                key={photo.id}
                src={photo.image!.sizes['320']}
                alt=""
                className="size-[98px] rounded-field bg-chip-haze object-cover shadow-[0_0_0_2px_var(--color-ink-night)]"
              />
            ))}
            {/* рамка снаружи размера, как в макете (content-box) */}
            <span className="box-content flex size-[98px] flex-col items-center justify-center gap-1 rounded-field border-[1.5px] border-dashed border-[#c9c3e3] bg-[#f6f5fb] text-[12px] font-semibold text-ink-quiet">
              <Icon name="plus" size={20} />
              <Trans>Добавить</Trans>
            </span>
          </div>
          <p className="mt-2 text-[12px] text-ink-muted">
            <Trans>Перетащите фото сюда или поменяйте порядок. До 10 фото.</Trans>
          </p>
        </>
      ) : (
        <div
          className={cx(
            'box-content flex h-[110px] flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 border-dashed border-[#c9c3e3] bg-[#f8f7fd] text-[14px] text-ink-quiet',
            cover && 'mt-2',
          )}
        >
          <Icon name="image" size={26} />
          <span>
            <Trans>
              <b className="text-iris">Добавьте фото</b> или перетащите сюда
            </Trans>
          </span>
        </div>
      )}
    </div>
  );
}
