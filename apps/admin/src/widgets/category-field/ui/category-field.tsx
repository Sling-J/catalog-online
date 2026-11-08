import { Trans, useLingui } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { CategorySheet, useCategoryActions } from '@/features/manage-categories';
import { SelectField } from '@/features/product-form';
import { categoriesQueryOptions, flattenCategories } from '@/entities/category';

/**
 * «Категория» в карточке и новом товаре (UX-аудит, U8): после категорий, под чертой, — «Новая категория»
 * (шторка с названием, созданная сразу выбирается) и «Настроить категории». Новый магазин без категорий не
 * упирается в пустой выбор и не уходит в «Магазин».
 */
export function CategoryField({
  label,
  note,
  value,
  chevron,
  className,
  onChange,
}: {
  label: ReactNode;
  note?: ReactNode;
  value: string | null;
  chevron?: boolean;
  className?: string;
  onChange: (categoryId: string | null) => void;
}) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { data: tree } = useSuspenseQuery(categoriesQueryOptions());
  const actions = useCategoryActions();
  // свой ключ у каждого открытия: поля шторки начинаются заново
  const [sheet, setSheet] = useState({ open: false, key: 0 });

  return (
    <>
      <SelectField
        chevron={chevron}
        label={label}
        title={t`Категория`}
        note={note}
        value={value ?? ''}
        options={[
          { value: '', label: t`Без категории` },
          ...flattenCategories(tree).map((category) => ({
            value: category.id,
            label: category.name,
            depth: category.depth,
          })),
        ]}
        actions={[
          {
            key: 'new',
            icon: 'plus',
            label: <Trans>Новая категория</Trans>,
            onSelect: () => setSheet((state) => ({ open: true, key: state.key + 1 })),
          },
          {
            key: 'manage',
            icon: 'tag',
            label: <Trans>Настроить категории</Trans>,
            onSelect: () => void navigate({ to: '/shop/categories' }),
          },
        ]}
        className={className}
        onChange={(next) => onChange(next || null)}
      />
      {/* поле стоит внутри формы товара — шторку с её формой выносим в body: вложенных форм в HTML нет */}
      {createPortal(
        <CategorySheet
          key={sheet.key}
          open={sheet.open}
          tree={tree}
          category={null}
          actions={actions}
          onClose={() => setSheet((state) => ({ ...state, open: false }))}
          onDelete={() => undefined}
          onCreated={(category) => onChange(category.id)}
        />,
        document.body,
      )}
    </>
  );
}
