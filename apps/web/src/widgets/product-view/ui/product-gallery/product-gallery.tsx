import type { Image } from '@catalog/contract';
import { cx, Icon } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

const arrowButton =
  'absolute top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-ink-night opacity-0 shadow-[0_4px_14px_rgb(23_19_61/0.12)] backdrop-blur-[10px] transition-opacity group-hover:opacity-100 hover:bg-white focus-visible:opacity-100 lg:flex';

/**
 * Галерея: фото листаются свайпом (прокрутка с «прилипанием»), точки показывают текущее.
 * На телефоне 4:5 на всю ширину, на компьютере заполняет всю высоту окна товара; там свайпа нет,
 * поэтому по краям фото при наведении появляются стрелки (клавиши ← → в окне листают товары, не фото).
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
  const { t } = useLingui();
  const ratio = short ? 'h-[380px] lg:h-full' : 'aspect-[4/5] lg:aspect-auto lg:h-full';
  const [index, setIndex] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  if (photos.length === 0) return <div aria-hidden="true" className={cx('w-full bg-chip-haze', ratio)} />;

  const show = (position: number) => {
    const element = list.current;
    element?.scrollTo({ left: position * element.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="group relative lg:h-full">
      <ul
        ref={list}
        onScroll={(event) => {
          const element = event.currentTarget;
          setIndex(Math.round(element.scrollLeft / element.clientWidth));
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
        <>
          {index > 0 && (
            <button
              type="button"
              onClick={() => show(index - 1)}
              aria-label={t`Предыдущее фото`}
              className={`${arrowButton} left-4`}
            >
              <Icon name="chevron-left" size={20} strokeWidth={2.4} />
            </button>
          )}
          {index < photos.length - 1 && (
            <button
              type="button"
              onClick={() => show(index + 1)}
              aria-label={t`Следующее фото`}
              className={`${arrowButton} right-4`}
            >
              <Icon name="chevron-right" size={20} strokeWidth={2.4} />
            </button>
          )}
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
        </>
      )}
    </div>
  );
}
