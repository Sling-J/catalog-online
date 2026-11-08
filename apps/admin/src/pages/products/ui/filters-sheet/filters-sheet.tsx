import { Button, cx, Icon, Sheet } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { categoriesQueryOptions, flattenCategories } from '@/entities/category';
import { PRODUCT_SORTS, type ProductSort, useSortLabels } from '@/entities/product';

/**
 * Порядок и категория на телефоне (UX-аудит, E3, U9; макета нет — по образцу шторки «Перенести в категорию»):
 * кнопка рядом с поиском — с точкой, если что-то выбрано, — и шторка. Выбор применяется сразу; внизу категорий —
 * «Настроить категории».
 */
export function FiltersButton({
  sort,
  category,
  onChange,
}: {
  sort: ProductSort | undefined;
  category: string | undefined;
  onChange: (patch: { sort?: ProductSort; category?: string }) => void;
}) {
  const { t } = useLingui();
  const labels = useSortLabels();
  const { data: tree } = useSuspenseQuery(categoriesQueryOptions());
  const [open, setOpen] = useState(false);
  const categories = [{ id: '', name: t`Все категории`, depth: 0 }, ...flattenCategories(tree)];
  const active = Boolean(sort || category);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={active ? t`Порядок и категория — выбрано` : t`Порядок и категория`}
        className="press relative flex size-[46px] flex-none items-center justify-center rounded-field bg-chip-haze hover:bg-haze-hover lg:hidden"
      >
        <Icon name="sliders" size={20} />
        {active && <span aria-hidden="true" className="absolute top-2.5 right-2.5 size-2 rounded-full bg-iris" />}
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={<Trans>Порядок и категория</Trans>}
        headerAction={
          active && (
            <button
              type="button"
              onClick={() => onChange({ sort: undefined, category: undefined })}
              className="text-[14px] font-semibold text-iris"
            >
              <Trans>Сбросить</Trans>
            </button>
          )
        }
      >
        <div className="text-[13px] font-semibold text-ink-quiet">
          <Trans>Порядок</Trans>
        </div>
        <Options
          label={t`Порядок`}
          options={PRODUCT_SORTS.map((value) => ({ value, label: labels[value] }))}
          value={sort ?? 'new'}
          onSelect={(value) => onChange({ sort: value === 'new' ? undefined : (value as ProductSort) })}
        />
        <div className="mt-4 text-[13px] font-semibold text-ink-quiet">
          <Trans>Категория</Trans>
        </div>
        <Options
          label={t`Категория`}
          options={categories.map((item) => ({
            value: item.id,
            label: `${' '.repeat(item.depth * 3)}${item.name}`,
          }))}
          value={category ?? ''}
          onSelect={(value) => onChange({ category: value || undefined })}
        />
        <Link
          to="/shop/categories"
          className="mt-1 flex h-[49px] items-center gap-2 px-1 text-[15px] font-semibold text-iris"
        >
          <Icon name="tag" size={18} />
          <Trans>Настроить категории</Trans>
        </Link>
        <Button variant="dark" size="form" block className="mt-3" onClick={() => setOpen(false)}>
          <Trans>Готово</Trans>
        </Button>
      </Sheet>
    </>
  );
}

function Options({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="mt-1">
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onSelect(option.value)}
            className="flex h-[49px] w-full items-center gap-3 border-b border-[#f0eef7] px-1 text-left"
          >
            <span
              className={cx(
                'min-w-0 flex-1 truncate text-[15px] whitespace-pre',
                checked ? 'font-bold' : 'font-medium',
              )}
            >
              {option.label}
            </span>
            <span
              aria-hidden="true"
              className={cx(
                'size-[22px] flex-none rounded-full bg-white',
                checked ? 'border-[7px] border-ink-night' : 'border-2 border-[#c9c3e3]',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
