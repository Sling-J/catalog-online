import type { Attribute } from '@catalog/contract';
import { Icon, Sheet, Switch, useIsDesktop } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';

import { problemCode } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';
import { invalidFields, setFormError, setServerError, submitForm, useAppForm } from '@/shared/ui';

import type { AttributeActions } from '../../hooks';
import { parseValues } from '../../lib';

const NAME_MAX = 60;

/**
 * Шторка свойства (на компьютере — окно; макета нет). Новое — название, значения через запятую и «Показывать в
 * фильтрах витрины» (по умолчанию да, как в контракте). Существующее — название и «Удалить свойство»; значения
 * правят чипами на карточке, «в фильтрах» — переключателем на ней же.
 */
export function AttributeSheet({
  open,
  attribute,
  actions,
  onClose,
  onCreated,
  onDelete,
}: {
  open: boolean;
  /** Нет — новое свойство. */
  attribute: Attribute | null;
  actions: AttributeActions;
  onClose: () => void;
  onCreated: (attribute: Attribute) => void;
  onDelete: (attribute: Attribute) => void;
}) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const isDesktop = useIsDesktop();

  const form = useAppForm({
    defaultValues: { name: attribute?.name ?? '', values: '', inFilters: true },
    validators: {
      onSubmit: ({ value }) =>
        invalidFields({
          name: !value.name.trim()
            ? t`Введите название`
            : value.name.trim().length > NAME_MAX
              ? t`Не длиннее ${NAME_MAX} символов`
              : undefined,
          values: parseValues(value.values).some((item) => item.length > NAME_MAX)
            ? t`Значение — не длиннее ${NAME_MAX} символов`
            : undefined,
        }),
    },
    onSubmit: async ({ value, formApi }) => {
      const name = value.name.trim();
      try {
        if (!attribute) {
          onCreated(await actions.create({ name, inFilters: value.inFilters, values: parseValues(value.values) }));
        } else if (name !== attribute.name) {
          await actions.rename(attribute, name);
        }
        onClose();
      } catch (error) {
        if (problemCode(error) === 'attribute_name_taken')
          setServerError(formApi, 'name', t`Свойство с таким названием уже есть`);
        else setFormError(formApi, messages.failed);
      }
    },
  });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      placement={isDesktop ? 'center' : 'bottom'}
      title={attribute ? <Trans>Свойство</Trans> : <Trans>Новое свойство</Trans>}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submitForm(form);
        }}
      >
        <div className="flex flex-col gap-3.5">
          <form.AppField name="name">
            {(field) => (
              <field.TextField
                label={t`Название`}
                placeholder={t`Например, Цвет`}
                maxLength={NAME_MAX}
                autoFocus={!attribute}
              />
            )}
          </form.AppField>
          {!attribute && (
            <>
              <form.AppField name="values">
                {(field) => (
                  <field.TextField
                    label={t`Значения`}
                    note={<span className="font-normal text-ink-muted">{t`необязательно`}</span>}
                    placeholder={t`синий, красный, белый`}
                    hint={t`Через запятую. Можно добавить и потом.`}
                  />
                )}
              </form.AppField>
              <form.Field name="inFilters">
                {(field) => (
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                    label={<span className="font-semibold">{t`Показывать в фильтрах витрины`}</span>}
                    className="py-1 text-left"
                  />
                )}
              </form.Field>
            </>
          )}
        </div>

        <form.AppForm>
          <form.SubmitButton variant="dark" size="form" block className="mt-[18px]">
            {attribute ? <Trans>Сохранить</Trans> : <Trans>Добавить</Trans>}
          </form.SubmitButton>
          <form.FormServerError />
        </form.AppForm>

        {attribute && (
          <button
            type="button"
            onClick={() => onDelete(attribute)}
            className="mx-auto mt-4 flex items-center gap-1.5 text-[14px] font-semibold text-coral-underside hover:underline"
          >
            <Icon name="trash" size={16} />
            <Trans>Удалить свойство</Trans>
          </button>
        )}
      </form>
    </Sheet>
  );
}
