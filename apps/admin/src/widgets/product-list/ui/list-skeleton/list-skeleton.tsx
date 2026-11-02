import { SKELETON_ROWS } from '../../constants';

/** Загрузка списка на телефоне (доска AdminProductsStates, экран 5): серые строки вместо товаров. */
export function ListSkeleton() {
  return (
    <div aria-hidden="true" className="pt-[18px]">
      {SKELETON_ROWS.map(([name, sub], index) => (
        <div key={index} className="flex items-center gap-3 border-b border-[#f0eef7] py-2.5">
          <span className="size-14 flex-none rounded-[14px] bg-chip-haze" />
          <div className="flex-1">
            <div className="h-3.5 rounded-[7px] bg-chip-haze" style={{ width: name }} />
            <div className="mt-2 h-3 rounded-md bg-[#f3f2fa]" style={{ width: sub }} />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="h-3.5 w-16 rounded-[7px] bg-chip-haze" />
            <div className="h-3 w-10 rounded-md bg-[#f3f2fa]" />
          </div>
        </div>
      ))}
    </div>
  );
}
