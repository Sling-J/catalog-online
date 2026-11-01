import { cx } from '@catalog/ui';

import { Skeleton } from '@/shared/ui';

const DELAYS = [0, 0.12, 0.24];

/** Строка «N товаров · сортировка» и сетка мерцающих квадратов — пока выборка грузится. */
export function GridSkeleton({ count = 15 }: { count?: number }) {
  return (
    <section aria-busy="true" className="mx-auto max-w-[1240px]">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-3 lg:hidden">
        <Skeleton className="h-3.5 w-[82px] rounded-lg" />
        <Skeleton className="h-3.5 w-[110px] rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-0.5 lg:grid-cols-5 lg:gap-2 lg:px-5">
        {Array.from({ length: count }, (_, index) => (
          // на компьютере два ряда по пять, со скруглением, как у плиток
          <Skeleton
            key={index}
            className={cx('aspect-square lg:rounded-[14px]', index >= 10 && 'lg:hidden')}
            delay={DELAYS[index % 3]}
          />
        ))}
      </div>
    </section>
  );
}
