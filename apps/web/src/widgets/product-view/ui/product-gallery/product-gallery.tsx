import type { Image } from '@catalog/contract';
import { cx } from '@catalog/ui';
import { useState } from 'react';

/** Галерея на всю ширину: фото листаются свайпом (прокрутка с «прилипанием»), точки показывают текущее. */
export function ProductGallery({ photos, name }: { photos: Image[]; name: string }) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) return <div aria-hidden="true" className="aspect-[4/5] w-full bg-chip-haze" />;

  return (
    <div className="relative">
      <ul
        onScroll={(event) => {
          const list = event.currentTarget;
          setIndex(Math.round(list.scrollLeft / list.clientWidth));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo, position) => (
          <li key={photo.sizes[1280]} className="w-full flex-none snap-center">
            <img
              src={photo.sizes[640]}
              srcSet={`${photo.sizes[640]} 640w, ${photo.sizes[1280]} 1280w`}
              sizes="(min-width: 1024px) 640px, 100vw"
              width={photo.width}
              height={photo.height}
              alt={photos.length > 1 ? `${name} (${position + 1}/${photos.length})` : name}
              loading={position === 0 ? 'eager' : 'lazy'}
              fetchPriority={position === 0 ? 'high' : 'auto'}
              className="block aspect-[4/5] w-full bg-chip-haze object-cover"
            />
          </li>
        ))}
      </ul>
      {photos.length > 1 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-3.5 flex justify-center gap-1.5"
        >
          {photos.map((photo, position) => (
            <span
              key={photo.sizes[1280]}
              className={cx(
                'h-1.5 rounded-pill bg-white shadow-sm transition-all',
                position === index ? 'w-4' : 'w-1.5 opacity-70',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
