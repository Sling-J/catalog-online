import { cx, Icon } from '@catalog/ui';
import { useSortable } from '@dnd-kit/react/sortable';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import type { PhotoTile as Tile } from '../../types';

import { CoverBadge } from './cover-badge';

/**
 * Плитка фото: картинка с сервера, пока её нет — файл с устройства. Пока файл едет или сервер его сжимает —
 * вуаль с крутилкой; не загрузилось или не обработалось — значок и подпись. Нажатие — действия с фото,
 * удержание и перетаскивание — порядок. HEIC браузер может не показать — тогда значок картинки вместо превью.
 */
export function PhotoTile({
  tile,
  index,
  size,
  cover,
  className,
  onOpen,
}: {
  tile: Tile;
  index: number;
  /** cover — большая обложка на компьютере (берём 1280 px), thumb — маленькая плитка (320 px). */
  size: 'cover' | 'thumb';
  /** Как отметить обложку: плашкой «Обложка» (компьютер) или жёлтой рамкой (телефон). */
  cover?: 'badge' | 'ring';
  className?: string;
  onOpen: () => void;
}) {
  const { t } = useLingui();
  const { ref, isDragSource } = useSortable({ id: tile.id, index, disabled: !tile.sortable });
  const [broken, setBroken] = useState<string>();
  const src = tile.image?.sizes[size === 'cover' ? '1280' : '320'] ?? tile.preview;
  const busy = tile.state === 'uploading' || tile.state === 'processing';
  const failed = tile.state === 'upload-failed' || tile.state === 'processing-failed';
  const status = {
    ready: '',
    processing: t`обрабатывается`,
    uploading: t`загружается`,
    'upload-failed': t`не загрузилось`,
    'processing-failed': t`не обработалось`,
  }[tile.state];
  const label = [cover ? t`Обложка` : t`Фото ${index + 1}`, status].filter(Boolean).join(', ');
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={onOpen}
      className={cx(
        'relative block flex-none touch-manipulation overflow-hidden bg-chip-haze outline-offset-2 select-none',
        cover === 'ring' && 'shadow-[0_0_0_3px_var(--color-sun)]',
        // пока тянут, на старом месте остаётся бледный след
        isDragSource && 'opacity-40',
        className,
      )}
    >
      {src && broken !== src ? (
        <img src={src} alt="" draggable={false} onError={() => setBroken(src)} className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-ink-muted">
          <Icon name="image" size={size === 'cover' ? 40 : 24} />
        </span>
      )}
      {busy && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/55">
          <span
            aria-hidden="true"
            className={cx(
              'animate-spin rounded-full border-iris/25 border-t-iris',
              size === 'cover' ? 'size-8 border-[3px]' : 'size-6 border-[2.5px]',
            )}
          />
          {size === 'cover' && (
            <span className="text-[13px] font-semibold text-ink-quiet">
              {tile.state === 'uploading' ? t`Загружаем…` : t`Обрабатываем…`}
            </span>
          )}
        </span>
      )}
      {failed && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/80 px-1 text-center text-[12px] leading-tight font-semibold text-coral-underside">
          <Icon name="warning" size={size === 'cover' ? 28 : 20} />
          {tile.state === 'upload-failed' ? t`Не загрузилось` : t`Не обработалось`}
        </span>
      )}
      {cover === 'badge' && <CoverBadge />}
    </button>
  );
}
