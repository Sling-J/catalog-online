import { move } from '@dnd-kit/helpers';
import { DragDropProvider, KeyboardSensor, PointerSensor } from '@dnd-kit/react';
import { useRef, useState, type ReactNode } from 'react';

import type { PhotoTile } from '../../types';

// Enter у плитки открывает действия с фото, поэтому перетаскивание с клавиатуры — пробелом; стрелки двигают,
// пробел или Enter отпускают, Escape отменяет
const SENSORS = [
  PointerSensor,
  KeyboardSensor.configure({
    keyboardCodes: {
      start: ['Space'],
      cancel: ['Escape'],
      end: ['Space', 'Enter', 'Tab'],
      up: ['ArrowUp'],
      down: ['ArrowDown'],
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
    },
  }),
];

/**
 * Порядок фото перетаскиванием (dnd-kit). Пока тянут, порядок живёт здесь — плитки перерисовываются на новых
 * местах (первая становится обложкой и на компьютере вырастает); отпустили — `onReorder` с новым порядком.
 * На телефоне перетаскивание начинается после короткого удержания, чтобы строку можно было листать.
 */
export function SortablePhotos({
  tiles,
  onReorder,
  children,
}: {
  tiles: PhotoTile[];
  onReorder: (ids: string[]) => void;
  children: (tiles: PhotoTile[]) => ReactNode;
}) {
  const [order, setOrder] = useState<string[] | null>(null);
  const latest = useRef(order);
  latest.current = order;
  const ids = tiles.filter((tile) => tile.sortable).map((tile) => tile.id);
  const byId = new Map(tiles.map((tile) => [tile.id, tile]));
  const shown = order
    ? [
        ...order.flatMap((id) => byId.get(id) ?? []),
        ...tiles.filter((tile) => !tile.sortable || !order.includes(tile.id)),
      ]
    : tiles;
  return (
    <DragDropProvider
      sensors={SENSORS}
      onDragStart={() => setOrder(ids)}
      onDragOver={(event) => setOrder((current) => current && move(current, event))}
      onDragEnd={(event) => {
        const final = latest.current;
        setOrder(null);
        if (event.canceled || !final || final.join() === ids.join()) return;
        onReorder(final);
      }}
    >
      {children(shown)}
    </DragDropProvider>
  );
}
