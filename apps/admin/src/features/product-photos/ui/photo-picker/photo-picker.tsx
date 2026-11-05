import { useRef, useState, type ReactNode } from 'react';

import { PHOTO_ACCEPT } from '../../constants';
import type { PhotoList } from '../../types';
import { PhotoActions } from '../photo-actions';
import { SortablePhotos } from '../sortable-photos';

export type PhotoPickerApi = {
  /** Плитки в текущем порядке (пока тянут — в новом). */
  tiles: PhotoList['tiles'];
  /** Открыть выбор файлов. */
  choose: () => void;
  /** Открыть действия с фото. */
  open: (id: string) => void;
};

/**
 * Общее у строки фото (телефон) и панели (компьютер): скрытый выбор файлов (несколько сразу; на телефоне — снять
 * или из галереи), перетаскивание и действия с фото по нажатию. Раскладку рисует `children`.
 */
export function PhotoPicker({ photos, children }: { photos: PhotoList; children: (api: PhotoPickerApi) => ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  const [openId, setOpenId] = useState<string>();
  const opened = photos.tiles.find((tile) => tile.id === openId);
  const sortableIds = photos.tiles.filter((tile) => tile.sortable).map((tile) => tile.id);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={PHOTO_ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          photos.add([...(event.target.files ?? [])]);
          event.target.value = '';
        }}
      />
      <SortablePhotos tiles={photos.tiles} onReorder={photos.reorder}>
        {(tiles) => children({ tiles, choose: () => input.current?.click(), open: setOpenId })}
      </SortablePhotos>
      <PhotoActions
        tile={opened}
        isCover={opened !== undefined && photos.tiles[0]?.id === opened.id}
        onClose={() => setOpenId(undefined)}
        onMakeCover={() => openId && photos.reorder([openId, ...sortableIds.filter((id) => id !== openId)])}
        onRetry={() => openId && photos.retry(openId)}
        onRemove={() => (openId ? photos.remove(openId) : Promise.resolve())}
      />
    </>
  );
}
