import type { Attribute } from '@catalog/contract';
import { Icon, Sheet, useIsDesktop } from '@catalog/ui';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { problemCode } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';
import { FormError, invalidFields, setFormError, setServerError, submitForm, useAppForm } from '@/shared/ui';

import type { AttributeActions } from '../../hooks';

type Value = Attribute['values'][number];

const VALUE_MAX = 60;

/**
 * Шторка значения свойства (на компьютере — окно; макета нет): переименовать и удалить. Значение, которое стоит
 * у вариантов, удалить нельзя (API: `attribute_value_in_use`) — вместо кнопки пояснение, сколько вариантов с ним.
 * Новое имя сразу видно во всех товарах с этим значением.
 */
export function ValueSheet({
  open,
  attribute,
  value,
  actions,
  onClose,
}: {
  open: boolean;
  attribute: Attribute | null;
  value: Value | null;
  actions: AttributeActions;
  onClose: () => void;
}) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const isDesktop = useIsDesktop();
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const used = value?.usageCount ?? 0;
  const others = (attribute?.values ?? []).filter((entry) => entry.id !== value?.id);

  const form = useAppForm({
    defaultValues: { value: value?.value ?? '' },
    validators: {
      onSubmit: ({ value: input }) => {
        const text = input.value.trim();
        return invalidFields({
          value: !text
            ? t`Введите значение`
            : others.some((entry) => entry.value.toLowerCase() === text.toLowerCase())
              ? t`Такое значение уже есть`
              : undefined,
        });
      },
    },
    onSubmit: async ({ value: input, formApi }) => {
      if (!attribute || !value) return;
      const text = input.value.trim();
      try {
        if (text !== value.value)
          await actions.saveValues(
            attribute,
            attribute.values.map((entry) => ({ id: entry.id, value: entry.id === value.id ? text : entry.value })),
          );
        onClose();
      } catch (error) {
        if (problemCode(error) === 'attribute_value_taken')
          setServerError(formApi, 'value', t`Такое значение уже есть`);
        else setFormError(formApi, messages.failed);
      }
    },
  });

  const remove = async () => {
    if (!attribute || !value) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      await actions.saveValues(
        attribute,
        others.map((entry) => ({ id: entry.id, value: entry.value })),
      );
      onClose();
    } catch (error) {
      setRemoveError(
        problemCode(error) === 'attribute_value_in_use'
          ? t`Значение уже стоит у товаров — удалить нельзя.`
          : t`Не получилось удалить. Проверьте интернет и попробуйте ещё раз.`,
      );
    } finally {
      setRemoving(false);
    }
  };

  const name = attribute?.name ?? '';
  return (
    <Sheet open={open} onClose={onClose} placement={isDesktop ? 'center' : 'bottom'} title={name}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submitForm(form);
        }}
      >
        <form.AppField name="value">
          {(field) => (
            <field.TextField
              label={t`Значение`}
              maxLength={VALUE_MAX}
              hint={
                used > 0 ? (
                  <Plural
                    value={used}
                    one="Стоит у # варианта — новое название появится и у него."
                    other="Стоит у # вариантов — новое название появится и у них."
                  />
                ) : (
                  t`Пока не стоит ни у одного варианта.`
                )
              }
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton variant="dark" size="form" block className="mt-[18px]">
            <Trans>Сохранить</Trans>
          </form.SubmitButton>
          <form.FormServerError />
        </form.AppForm>

        {used > 0 ? (
          <p className="mt-4 text-center text-[13px] leading-[1.45] text-ink-muted">
            <Trans>Удалить можно, когда значение не стоит ни у одного варианта.</Trans>
          </p>
        ) : (
          <button
            type="button"
            disabled={removing}
            onClick={() => void remove()}
            className="mx-auto mt-4 flex items-center gap-1.5 text-[14px] font-semibold text-coral-underside hover:underline disabled:opacity-60"
          >
            <Icon name="trash" size={16} />
            <Trans>Удалить значение</Trans>
          </button>
        )}
        {removeError && <FormError>{removeError}</FormError>}
      </form>
    </Sheet>
  );
}
