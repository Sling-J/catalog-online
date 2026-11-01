import type { Image } from '@catalog/contract';
import { cx } from '@catalog/ui';
import { useState } from 'react';

/**
 * Галерея: фото листаются свайпом (прокрутка с «прилипанием»), точки показывают текущее.
 * На телефоне 4:5 на всю ширину, на компьютере заполняет всю высоту окна товара.
 */
export function ProductGallery({
  photos,
  name,
  short,
}: {
  photos: Image[];
  name: string;
  /** Ниже обычного (380 px на телефоне) — у закончившегося товара, чтобы под ним поместилась подборка. */
  short?: boolean;
}) {
  const ratio = short ? 'h-[380px] lg:h-full' : 'aspect-[4/5] lg:aspect-auto lg:h-full';
  const [index, setIndex] = useState(0);

  if (photos.length === 0) return <div aria-hidden="true" className={cx('w-full bg-chip-haze', ratio)} />;

  return (
    <div className="relative lg:h-full">
      <ul
        onScroll={(event) => {
          const list = event.currentTarget;
          setIndex(Math.round(list.scrollLeft / list.clientWidth));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] lg:h-full [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo, position) => (
          <li key={photo.sizes[1280]} className="w-full flex-none snap-center">
            <img
              src={photo.sizes[640]}
              srcSet={`${photo.sizes[640]} 640w, ${photo.sizes[1280]} 1280w`}
              sizes="(min-width: 1024px) 576px, 100vw"
              width={photo.width}
              height={photo.height}
              alt={photos.length > 1 ? `${name} (${position + 1}/${photos.length})` : name}
              loading={position === 0 ? 'eager' : 'lazy'}
              fetchPriority={position === 0 ? 'high' : 'auto'}
              className={cx('block w-full bg-chip-haze object-cover', ratio)}
            />
          </li>
        ))}
      </ul>
      {photos.length > 1 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-3.5 flex justify-center gap-1.5 lg:bottom-4"
        >
          {photos.map((photo, position) => (
            <span
              key={photo.sizes[1280]}
              className={cx(
                'h-[7px] rounded-pill shadow-[0_1px_3px_rgb(0_0_0/0.2)] transition-all',
                position === index ? 'w-[18px] bg-white' : 'w-[7px] bg-white/60',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
