import { Button, cx, Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useRef } from 'react';

import type { PhotoList } from '../../types';
import { PhotoErrorText } from '../photo-error-text';
import { PhotoPicker } from '../photo-picker';
import { PhotoTile } from '../photo-tile';

const dashed =
  'flex flex-col items-center justify-center gap-1 rounded-[20px] border-[1.5px] border-dashed border-[#c9c3e3] bg-[#f6f5fb] text-[12px] font-semibold text-ink-quiet';

/**
 * Фото одного товара в быстром режиме (макет AdminPhone, экран 4): обложка 230 px в плашке «Обложка» и справа
 * «Ещё фото» (камера) и «Из галереи»; внизу «Переснять» и «Дальше →». Пока фото нет (макета нет — A25) — пунктирное
 * поле «Снять» и «Из галереи», а внизу одна кнопка «Снять». «Переснять» открывает камеру и заменяет фото новым.
 * Остальные фото (если снято больше одного) — строкой под обложкой; нажатие на фото — действия с ним.
 */
export function QuickBoard({
  photos,
  busy,
  last,
  onNext,
}: {
  photos: PhotoList;
  /** Фото ещё едут на сервер — «Дальше» подождёт. */
  busy: boolean;
  /** Товар последний в очереди: вместо «Дальше →» — «Готово». */
  last: boolean;
  onNext: () => void;
}) {
  // «Переснять»: старые фото уйдут, когда придёт новое
  const replacing = useRef<string[]>([]);
  const wrapped: PhotoList = {
    ...photos,
    add: (files) => {
      photos.add(files);
      const old = replacing.current;
      replacing.current = [];
      old.forEach((id) => void photos.remove(id).catch(() => undefined));
    },
  };
  return (
    <PhotoPicker photos={wrapped}>
      {({ tiles, choose, open }) => {
        const [cover, ...rest] = tiles;
        const shoot = (replace: boolean) => {
          replacing.current = replace ? tiles.map((tile) => tile.id) : [];
          choose('camera');
        };
        return (
          <>
            <div className="flex gap-2 px-4 pt-4">
              {cover ? (
                <PhotoTile
                  tile={cover}
                  index={0}
                  size="cover"
                  cover="badge"
                  className="size-[230px] rounded-[24px]"
                  onOpen={() => open(cover.id)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => shoot(false)}
                  className={cx(dashed, 'size-[230px] gap-2 text-[15px]')}
                >
                  <Icon name="camera" size={36} />
                  <Trans>Снять</Trans>
                </button>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {cover && photos.canAdd && (
                  <button type="button" onClick={() => shoot(false)} className={cx(dashed, 'min-h-0 flex-1')}>
                    <Icon name="camera" size={24} />
                    <Trans>Ещё фото</Trans>
                  </button>
                )}
                <button type="button" onClick={() => choose()} className={cx(dashed, 'min-h-0 flex-1')}>
                  <Icon name="image" size={24} />
                  <Trans>Из галереи</Trans>
                </button>
              </div>
            </div>
            {rest.length > 0 && (
              <div className="flex gap-2 overflow-x-auto px-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {rest.map((tile, index) => (
                  <PhotoTile
                    key={tile.id}
                    tile={tile}
                    index={index + 1}
                    size="thumb"
                    className="size-[72px] rounded-field"
                    onOpen={() => open(tile.id)}
                  />
                ))}
              </div>
            )}
            {photos.error && <PhotoErrorText error={photos.error} className="px-4 pt-2" />}
            <div className="mx-4 mt-4 rounded-[16px] bg-[#f1effa] px-3.5 py-3 text-[14px] leading-[1.45] text-ink-soft">
              <Trans>Снимайте на светлом фоне при дневном свете. Фото сожмём сами.</Trans>
            </div>
            <div className="fixed inset-x-0 bottom-0 z-10 lg:left-[248px]">
              <div className="mx-auto flex max-w-[430px] gap-2.5 px-4 pt-3 pb-[calc(26px+env(safe-area-inset-bottom))]">
                {cover ? (
                  <>
                    <Button variant="soft" size="form" onClick={() => shoot(true)} className="flex-none">
                      <Icon name="camera" size={20} />
                      <Trans>Переснять</Trans>
                    </Button>
                    <Button variant="confirm" size="form" onClick={onNext} disabled={busy} className="flex-1">
                      {last ? <Trans>Готово</Trans> : <Trans>Дальше →</Trans>}
                    </Button>
                  </>
                ) : (
                  <Button variant="confirm" size="form" block onClick={() => shoot(false)}>
                    <Icon name="camera" size={20} />
                    <Trans>Снять</Trans>
                  </Button>
                )}
              </div>
            </div>
          </>
        );
      }}
    </PhotoPicker>
  );
}
