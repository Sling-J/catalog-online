import { Button, cx, Sheet } from '@catalog/ui';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { categoriesQueryOptions, flattenCategories } from '@/entities/category';

/** Пустое значение выбора: «Без категории» — это тоже выбор (`null`). */
const NONE = 'none';

/**
 * Шторка «Перенести в категорию» на телефоне (доска AdminProductsStates, экран 2): категории кружками выбора,
 * «Без категории» последней, «Перенести» внизу. Строка 52 px плюс черта, как в макете.
 */
export function CategorySheet({
  open,
  count,
  pending,
  onClose,
  onPick,
}: {
  open: boolean;
  count: number;
  pending: boolean;
  onClose: () => void;
  onPick: (categoryId: string | null) => void;
}) {
  const { t } = useLingui();
  const { data: tree } = useSuspenseQuery(categoriesQueryOptions());
  const [choice, setChoice] = useState<string | null>(null);
  const options = [
    ...flattenCategories(tree).map((category) => ({ id: category.id, name: category.name, depth: category.depth })),
    { id: NONE, name: t`Без категории`, depth: 0 },
  ];
  return (
    <Sheet open={open} onClose={onClose} title={<Trans>Перенести в категорию</Trans>}>
      <div className="-mt-[9px] text-[14px] text-ink-quiet">
        <Plural value={count} one="# товар" few="# товара" other="# товаров" />
      </div>
      <div role="radiogroup" aria-label={t`Категория`} className="mt-2.5">
        {options.map((option) => {
          const checked = choice === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => setChoice(option.id)}
              className="flex h-[53px] w-full items-center gap-3 border-b border-[#f0eef7] px-1 text-left"
              style={{ paddingLeft: 4 + option.depth * 16 }}
            >
              <span className={cx('flex-1 text-[16px]', checked ? 'font-bold' : 'font-medium')}>{option.name}</span>
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
      <Button
        variant="dark"
        size="form"
        block
        className="mt-[18px]"
        disabled={choice === null || pending}
        onClick={() => choice && onPick(choice === NONE ? null : choice)}
      >
        <Trans>Перенести</Trans>
      </Button>
    </Sheet>
  );
}
