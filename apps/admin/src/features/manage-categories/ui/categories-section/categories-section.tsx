import type { Category } from '@catalog/contract';
import { move } from '@dnd-kit/helpers';
import { DragDropProvider } from '@dnd-kit/react';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import {
  categoriesQueryOptions,
  type CategoryGroups,
  categoryGroups,
  ROOT_GROUP,
  sameGroups,
} from '@/entities/category';
import { problemCode } from '@/shared/api';
import { ConfirmSheet, FormError } from '@/shared/ui';

import { useCategoryActions } from '../../hooks';
import { CategoryRow } from '../category-row';
import { CategorySheet } from '../category-sheet';

/**
 * «Категории» на экране «Категории и размеры» (FR-A6; макет AdminPhone2): «+ Категория», порядок перетаскиванием
 * (так они идут на витрине), подкатегории под родителем со сдвигом. Нажатие на строку — шторка: название, где
 * показывать, удалить. В макете у первой строки «38 товаров», дальше только числа — так и сделано.
 */
export function CategoriesSection() {
  const { t } = useLingui();
  const { data: tree } = useSuspenseQuery(categoriesQueryOptions());
  const actions = useCategoryActions();
  // пока тянут — порядок живёт здесь, отпустили — сохраняем
  const [dragging, setDragging] = useState<CategoryGroups | null>(null);
  const start = useRef<CategoryGroups | null>(null);
  const current = useRef<CategoryGroups | null>(null);
  // шторка: ключ пересоздаёт форму на каждое открытие, категория остаётся на время анимации закрытия
  const [sheet, setSheet] = useState<{ open: boolean; key: number; category: Category | null }>({
    open: false,
    key: 0,
    category: null,
  });
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const groups = dragging ?? categoryGroups(tree);
  const byId = new Map(tree.flatMap((category) => [category, ...category.children]).map((item) => [item.id, item]));
  const openSheet = (category: Category | null) => setSheet((state) => ({ open: true, key: state.key + 1, category }));

  const count = (category: Category, withUnit: boolean) =>
    withUnit ? (
      <Plural value={category.productCount} one="# товар" few="# товара" other="# товаров" />
    ) : (
      category.productCount
    );

  return (
    <section className="px-4 pt-4 lg:px-0 lg:pt-[18px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold">
          <Trans>Категории</Trans>
        </h2>
        <button
          type="button"
          onClick={() => openSheet(null)}
          className="text-[14px] font-semibold text-iris hover:underline"
        >
          <Trans>+ Категория</Trans>
        </button>
      </div>
      <p className="mt-0.5 text-[12px] text-ink-muted">
        <Trans>В таком порядке они идут на витрине. Перетаскивайте.</Trans>
      </p>

      {tree.length === 0 ? (
        <div className="mt-2.5 rounded-[18px] bg-white p-3.5 text-[14px] leading-[1.45] text-ink-quiet shadow-[0_1px_0_#eceaf5]">
          <Trans>Категорий пока нет. Добавьте первую — или загрузите Excel: категории из файла появятся сами.</Trans>
        </div>
      ) : (
        <DragDropProvider
          onDragStart={() => {
            start.current = categoryGroups(tree);
            current.current = start.current;
            setDragging(start.current);
          }}
          onDragOver={(event) => {
            if (!current.current) return;
            current.current = move(current.current, event);
            setDragging(current.current);
          }}
          onDragEnd={(event) => {
            const final = current.current;
            const initial = start.current;
            start.current = null;
            current.current = null;
            setDragging(null);
            if (event.canceled || !final || !initial || sameGroups(final, initial)) return;
            actions.saveOrder(final);
          }}
        >
          <div
            role="list"
            aria-label={t`Категории`}
            className="mt-2.5 overflow-hidden rounded-[18px] bg-white shadow-[0_1px_0_#eceaf5]"
          >
            {(groups[ROOT_GROUP] ?? []).map((id, index) => {
              const category = byId.get(id);
              if (!category) return null;
              return (
                <CategoryRow
                  key={id}
                  category={category}
                  index={index}
                  group={ROOT_GROUP}
                  first={index === 0}
                  count={count(category, index === 0)}
                  onOpen={openSheet}
                >
                  {(groups[id] ?? []).map((childId, childIndex) => {
                    const child = byId.get(childId);
                    return child ? (
                      <CategoryRow
                        key={childId}
                        category={child}
                        index={childIndex}
                        group={id}
                        nested
                        count={count(child, false)}
                        onOpen={openSheet}
                      />
                    ) : null;
                  })}
                </CategoryRow>
              );
            })}
          </div>
        </DragDropProvider>
      )}
      {actions.orderFailed && (
        <FormError>{t`Порядок не сохранился. Проверьте интернет и попробуйте ещё раз.`}</FormError>
      )}

      <CategorySheet
        key={sheet.key}
        open={sheet.open}
        tree={tree}
        category={sheet.category}
        actions={actions}
        onClose={() => setSheet((state) => ({ ...state, open: false }))}
        onDelete={(category) => {
          setSheet((state) => ({ ...state, open: false }));
          actions.remove.reset();
          setDeleting(category);
          setConfirmOpen(true);
        }}
      />
      <DeleteConfirm
        category={deleting}
        open={confirmOpen}
        pending={actions.remove.isPending}
        error={actions.remove.error}
        onConfirm={(category) =>
          actions.remove.mutate({ path: { categoryId: category.id } }, { onSuccess: () => setConfirmOpen(false) })
        }
        onClose={() => setConfirmOpen(false)}
      />
    </section>
  );
}

/** «Удалить категорию?»: что станет с товарами. Вернуть нельзя. */
function DeleteConfirm({
  category,
  open,
  pending,
  error,
  onConfirm,
  onClose,
}: {
  category: Category | null;
  open: boolean;
  pending: boolean;
  error: unknown;
  onConfirm: (category: Category) => void;
  onClose: () => void;
}) {
  const { t } = useLingui();
  const name = category?.name ?? '';
  const products = category?.productCount ?? 0;
  return (
    <ConfirmSheet
      open={open}
      title={<Trans>Удалить категорию «{name}»?</Trans>}
      text={
        <>
          {products > 0 ? (
            <Plural
              value={products}
              one="# товар останется без категории — на витрине он будет в «Все»."
              few="# товара останутся без категории — на витрине они будут в «Все»."
              other="# товаров останутся без категории — на витрине они будут в «Все»."
            />
          ) : (
            <Trans>Товаров в ней нет.</Trans>
          )}{' '}
          {error != null && (
            <span role="alert" className="mt-2 block text-[13px] text-coral-underside">
              {problemCode(error) === 'category_has_children'
                ? t`В ней появились подкатегории — сначала перенесите или удалите их.`
                : t`Не получилось удалить. Проверьте интернет и попробуйте ещё раз.`}
            </span>
          )}
        </>
      }
      confirm={<Trans>Удалить</Trans>}
      cancel={<Trans>Оставить</Trans>}
      pending={pending}
      onConfirm={() => category && onConfirm(category)}
      onClose={onClose}
    />
  );
}
