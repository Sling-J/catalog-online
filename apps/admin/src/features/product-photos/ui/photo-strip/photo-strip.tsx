import { cx, Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import type { PhotoList } from '../../types';
import { PhotoErrorText } from '../photo-error-text';
import { PhotoPicker } from '../photo-picker';
import { PhotoTile } from '../photo-tile';

/**
 * Фото товара на телефоне строкой: обложка в жёлтой рамке, дальше остальные и пунктирная плитка «Фото»
 * (макет AdminPhone, экран 3: 104 px) или «Ещё фото» с камерой (макет AdminPhone2, экран 7: 96 px). Плитка
 * открывает выбор файлов (снять или из галереи), удержание фото — перетаскивание, нажатие — действия с фото.
 * Под строкой — `hint` (в карточке — про обложку и порядок), при ошибке — она.
 */
export function PhotoStrip({ photos, size, hint }: { photos: PhotoList; size: 'edit' | 'new'; hint?: string }) {
  const box = size === 'edit' ? 'size-[104px]' : 'size-24';
  return (
    <PhotoPicker photos={photos}>
      {({ tiles, choose, open }) => (
        <>
          {/* прокрутка вбок обрезала бы жёлтую рамку обложки снизу — под ней 3 px */}
          <div className="flex gap-2 overflow-x-auto px-4 pt-3.5 pb-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tiles.map((tile, index) => (
              <PhotoTile
                key={tile.id}
                tile={tile}
                index={index}
                size="thumb"
                cover={index === 0 ? 'ring' : undefined}
                className={cx('rounded-thumb', box)}
                onOpen={() => open(tile.id)}
              />
            ))}
            {photos.canAdd && (
              // рамка снаружи размера, как в макете (content-box)
              <button
                type="button"
                onClick={choose}
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
                    {tiles.length > 0 ? <Trans>Ещё фото</Trans> : <Trans>Фото</Trans>}
                  </>
                )}
              </button>
            )}
          </div>
          {photos.error ? (
            <PhotoErrorText error={photos.error} className="px-4 pt-[3px]" />
          ) : (
            hint && <p className="px-4 pt-[3px] text-[12px] text-ink-muted">{hint}</p>
          )}
        </>
      )}
    </PhotoPicker>
  );
}
