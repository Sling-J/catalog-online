import type { Category } from '@catalog/contract';
import { cx, Icon, Sheet, useIsDesktop } from '@catalog/ui';
import { Plural, Trans, useLingui } from '@lingui/react/macro';

import { moveToParent } from '@/entities/category';
import { problemCode } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';
import { invalidFields, setFormError, setServerError, submitForm, useAppForm } from '@/shared/ui';

import type { CategoryActions } from '../../hooks';

const NAME_MAX = 80;
/** «Отдельная категория» в выборе родителя. */
const TOP = 'top';

/**
 * Шторка категории (на компьютере — окно): название и где она — отдельно или внутри другой категории (не больше
 * 2 уровней: категорию с подкатегориями внутрь не перенести). Для новой — «Добавить», для существующей —
 * «Сохранить» и «Удалить категорию»; у категории с подкатегориями вместо неё — пояснение (API не даст удалить,
 * 409 `category_has_children`). Макета нет — по образцу шторки «Перенести в категорию».
 */
export function CategorySheet({
  open,
  tree,
  category,
  actions,
  onClose,
  onDelete,
  onCreated,
}: {
  open: boolean;
  tree: Category[];
  /** Нет — новая категория. */
  category: Category | null;
  actions: CategoryActions;
  onClose: () => void;
  onDelete: (category: Category) => void;
  /** Новая категория создана — например, сразу выбрать её в карточке товара (UX-аудит, U8). */
  onCreated?: (category: Category) => void;
}) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const isDesktop = useIsDesktop();
  const parents = tree.filter((item) => item.id !== category?.id);
  const locked = (category?.children.length ?? 0) > 0;

  const form = useAppForm({
    defaultValues: { name: category?.name ?? '', parent: category?.parentId ?? TOP },
    validators: {
      onSubmit: ({ value }) =>
        invalidFields({
          name: !value.name.trim()
            ? t`Введите название`
            : value.name.trim().length > NAME_MAX
              ? t`Не длиннее ${NAME_MAX} символов`
              : undefined,
        }),
    },
    onSubmit: async ({ value, formApi }) => {
      const name = value.name.trim();
      const parentId = value.parent === TOP ? null : value.parent;
      try {
        if (!category) onCreated?.(await actions.create(name, parentId));
        else {
          if (name !== category.name) await actions.rename(category.id, name);
          if (parentId !== category.parentId) await actions.move(moveToParent(tree, category.id, parentId));
        }
        onClose();
      } catch (error) {
        if (problemCode(error) === 'category_name_taken')
          setServerError(formApi, 'name', t`Категория с таким названием здесь уже есть`);
        else setFormError(formApi, messages.failed);
      }
    },
  });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      placement={isDesktop ? 'center' : 'bottom'}
      title={category ? <Trans>Категория</Trans> : <Trans>Новая категория</Trans>}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          // шторка бывает внутри формы товара (U8): отправка не должна всплыть к ней
          event.stopPropagation();
          void submitForm(form);
        }}
      >
        <form.AppField name="name">
          {(field) => (
            <field.TextField label={t`Название`} placeholder={t`Например, Куртки`} maxLength={NAME_MAX} autoFocus />
          )}
        </form.AppField>

        {parents.length > 0 && (
          <div className="mt-4">
            <div className="text-[13px] font-semibold text-ink-quiet">
              <Trans>Где показывать</Trans>
            </div>
            {locked ? (
              <p className="mt-1.5 text-[14px] leading-[1.45] text-ink-quiet">
                <Trans>
                  Отдельной категорией: внутри неё есть подкатегории, а вложить можно только на один уровень.
                </Trans>
              </p>
            ) : (
              <form.Field name="parent">
                {(field) => (
                  <div role="radiogroup" aria-label={t`Где показывать`} className="mt-1">
                    {[{ id: TOP, name: t`Отдельной категорией` }, ...parents].map((option) => {
                      const checked = field.state.value === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={checked}
                          onClick={() => field.handleChange(option.id)}
                          className="flex h-[49px] w-full items-center gap-3 border-b border-[#f0eef7] px-1 text-left"
                        >
                          <span
                            className={cx('min-w-0 flex-1 truncate text-[15px]', checked ? 'font-bold' : 'font-medium')}
                          >
                            {option.id === TOP ? option.name : t`Внутри «${option.name}»`}
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
                )}
              </form.Field>
            )}
          </div>
        )}

        <form.AppForm>
          <form.SubmitButton variant="dark" size="form" block className="mt-[18px]">
            {category ? <Trans>Сохранить</Trans> : <Trans>Добавить</Trans>}
          </form.SubmitButton>
          <form.FormServerError />
        </form.AppForm>

        {category && category.children.length > 0 ? (
          <p className="mt-4 text-center text-[13px] leading-[1.45] text-ink-muted">
            <Plural
              value={category.children.length}
              one="Чтобы удалить, сначала перенесите или удалите подкатегорию (#)."
              other="Чтобы удалить, сначала перенесите или удалите подкатегории (#)."
            />
          </p>
        ) : category ? (
          <button
            type="button"
            onClick={() => onDelete(category)}
            className="mx-auto mt-4 flex items-center gap-1.5 text-[14px] font-semibold text-coral-underside hover:underline"
          >
            <Icon name="trash" size={16} />
            <Trans>Удалить категорию</Trans>
          </button>
        ) : null}
      </form>
    </Sheet>
  );
}
