/** Выбранные покупателем фильтры; хранятся в адресе страницы. */
export type FilterState = { values: string[]; priceMin?: number; priceMax?: number };

export type FilterSection = {
  id: string;
  name: string;
  values: { id: string; value: string; selected: boolean }[];
};

export type ActiveValueFilter = { id: string; attributeName: string; value: string };
