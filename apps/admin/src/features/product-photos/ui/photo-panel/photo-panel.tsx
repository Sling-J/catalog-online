import { cx, Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useState, type DragEvent } from 'react';

import type { PhotoList } from '../../types';
import { PhotoErrorText } from '../photo-error-text';
import { PhotoPicker } from '../photo-picker';
import { PhotoTile } from '../photo-tile';

const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes('Files');

/**
 * Фото на компьютере: обложка с плашкой «Обложка», под ней остальные и «Добавить» (макет AdminDesk, экран 2:
 * 420 px) либо поле «Добавьте фото или перетащите сюда» (макет AdminDesk2, экран 6: 340 px). Файлы можно бросить
 * на всю колонку — она подсвечивается; порядок — перетаскиванием плиток, нажатие — действия с фото. У товара без
 * фото в карточке — то же поле, что у нового товара (макета нет).
 */
export function PhotoPanel({ photos, size }: { photos: PhotoList; size: 'edit' | 'new' }) {
  const [dropping, setDropping] = useState(false);
  const edit = size === 'edit';
  const drop = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    setDropping(false);
    photos.add([...event.dataTransfer.files]);
  };
  return (
    <PhotoPicker photos={photos}>
      {({ tiles, choose, open }) => {
        const [cover, ...rest] = tiles;
        const zone = !edit || !cover;
        return (
          <div
            onDragOver={(event) => {
              if (!hasFiles(event)) return;
              event.preventDefault();
              setDropping(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropping(false);
            }}
            onDrop={drop}
            className={cx(
              'flex-none rounded-[28px] outline-2 outline-offset-8 outline-transparent transition-[outline-color]',
              dropping && 'outline-iris outline-dashed',
              edit ? 'w-[420px]' : 'w-[340px]',
            )}
          >
            {cover && (
              // в макете обложка — строчная картинка, под ней 4 px строки
              <div className="pb-1">
                <PhotoTile
                  tile={cover}
                  index={0}
                  size="cover"
                  cover="badge"
                  className={cx('rounded-[24px]', edit ? 'size-[420px]' : 'size-[340px]')}
                  onOpen={() => open(cover.id)}
                />
              </div>
            )}
            {(rest.length > 0 || (edit && cover && photos.canAdd)) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {rest.map((tile, index) => (
                  <PhotoTile
                    key={tile.id}
                    tile={tile}
                    index={index + 1}
                    size="thumb"
                    className={cx(
                      'rounded-field shadow-[0_0_0_2px_var(--color-ink-night)]',
                      // в 340 px нового товара — по три в ряд
                      edit ? 'size-[98px]' : 'size-[108px]',
                    )}
                    onOpen={() => open(tile.id)}
                  />
                ))}
                {edit && cover && photos.canAdd && (
                  // рамка снаружи размера, как в макете (content-box)
                  <button
                    type="button"
                    onClick={choose}
                    className="box-content flex size-[98px] flex-col items-center justify-center gap-1 rounded-field border-[1.5px] border-dashed border-[#c9c3e3] bg-[#f6f5fb] text-[12px] font-semibold text-ink-quiet"
                  >
                    <Icon name="plus" size={20} />
                    <Trans>Добавить</Trans>
                  </button>
                )}
              </div>
            )}
            {zone && photos.canAdd && (
              <button
                type="button"
                onClick={choose}
                className={cx(
                  'box-content flex h-[110px] w-[calc(100%-4px)] flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 border-dashed border-[#c9c3e3] bg-[#f8f7fd] text-[14px] text-ink-quiet',
                  cover && 'mt-2',
                )}
              >
                <Icon name="image" size={26} />
                <span>
                  <Trans>
                    <b className="text-iris">Добавьте фото</b> или перетащите сюда
                  </Trans>
                </span>
              </button>
            )}
            {photos.error ? (
              <PhotoErrorText error={photos.error} className="mt-2" />
            ) : (
              edit &&
              cover && (
                <p className="mt-2 text-[12px] text-ink-muted">
                  <Trans>Перетащите фото сюда или поменяйте порядок. До 10 фото.</Trans>
                </p>
              )
            )}
          </div>
        );
      }}
    </PhotoPicker>
  );
}
