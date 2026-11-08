import { Icon, Select } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { categoriesQueryOptions, flattenCategories } from '@/entities/category';

/**
 * «Все категории» справа от вкладок на компьютере (макет AdminDesk, экран 1): белая пилюля с рамкой и свой
 * список. Под чертой — «Настроить категории»: список — главное место, где думают о категориях (U9).
 */
export function CategorySelect({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (categoryId: string | undefined) => void;
}) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { data: tree } = useSuspenseQuery(categoriesQueryOptions());
  const options = [
    { value: '', label: t`Все категории` },
    ...flattenCategories(tree).map((category) => ({
      value: category.id,
      label: category.name,
      depth: category.depth,
    })),
  ];
  const current = options.find((option) => option.value === (value ?? '')) ?? options[0]!;
  return (
    <Select
      label={t`Категория`}
      value={value ?? ''}
      options={options}
      align="end"
      onChange={(next) => onChange(next || undefined)}
      actions={[
        {
          key: 'manage',
          icon: 'tag',
          label: <Trans>Настроить категории</Trans>,
          onSelect: () => void navigate({ to: '/shop/categories' }),
        },
      ]}
      className="press inline-flex h-[43px] max-w-[240px] flex-none items-center gap-2 rounded-pill border-[1.5px] border-line bg-white pr-3.5 pl-4 text-[14px] font-semibold hover:border-line-hover aria-expanded:border-ink-night"
    >
      <span className="truncate">{current.label}</span>
      <Icon name="chevron-down" size={15} className="flex-none" />
    </Select>
  );
}
