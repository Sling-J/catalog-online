import { Icon } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';

import { categoriesQueryOptions, flattenCategories } from '@/entities/category';

/** «Все категории» справа от вкладок на компьютере (макет AdminDesk, экран 1): белая пилюля с рамкой. */
export function CategorySelect({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (categoryId: string | undefined) => void;
}) {
  const { t } = useLingui();
  const { data: tree } = useSuspenseQuery(categoriesQueryOptions());
  return (
    <label className="relative inline-flex h-[43px] flex-none items-center rounded-pill border-[1.5px] border-line bg-white hover:border-line-hover focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-iris">
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || undefined)}
        aria-label={t`Категория`}
        className="h-full cursor-pointer appearance-none bg-transparent pr-[35px] pl-3.5 text-[14px] font-semibold outline-none"
      >
        <option value="">{t`Все категории`}</option>
        {flattenCategories(tree).map((category) => (
          <option key={category.id} value={category.id}>
            {`${' '.repeat(category.depth * 3)}${category.name}`}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" size={15} className="pointer-events-none absolute right-3.5" />
    </label>
  );
}
