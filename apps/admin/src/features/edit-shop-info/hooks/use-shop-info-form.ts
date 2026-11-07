import { type Shop, updateShop } from '@catalog/contract';
import { useLingui } from '@lingui/react/macro';
import { useStore } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { applyShop } from '@/entities/shop';
import { fieldErrors } from '@/shared/api';
import { useFormMessages } from '@/shared/hooks';
import { invalidFields, setFormError, setServerError, useAppForm } from '@/shared/ui';

import { draftFromShop, type ShopInfoDraft, shopInfoChanges, validateShopInfo } from '../lib';

/**
 * Форма «О магазине» (FR-A9) на TanStack Form (ADR 0003): название, описание, адрес, как найти, WhatsApp,
 * Instagram, график. Сохраняется только изменённое (`PATCH /shop`); после сохранения сохранённое становится
 * исходным — правок нет. Ошибки времени по дням показываются после первой попытки сохранить и гаснут по мере правки.
 */
export function useShopInfoForm({ shop, onSaved }: { shop: Shop; onSaved: (changed: boolean) => void }) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const queryClient = useQueryClient();
  // исходные значения храним сами: свежий объект на каждой отрисовке форма приняла бы за новые
  const [initial, setInitial] = useState(() => draftFromShop(shop));
  const save = useMutation({
    mutationFn: async (draft: ShopInfoDraft) => {
      const { data } = await updateShop({ body: shopInfoChanges(initial, draft), throwOnError: true });
      return data;
    },
    onSuccess: (saved) => applyShop(queryClient, saved),
  });

  const form = useAppForm({
    defaultValues: initial,
    validators: {
      onSubmit: ({ value }) => {
        const errors = validateShopInfo(value);
        return invalidFields({
          name: errors.name && t`Введите название`,
          whatsapp: errors.whatsapp && t`Номер — 10 цифр после +7`,
          schedule: Object.keys(errors.days).length > 0 ? 'days' : undefined,
        });
      },
    },
    onSubmit: async ({ value, formApi }) => {
      if (Object.keys(shopInfoChanges(initial, value)).length === 0) return onSaved(false);
      try {
        await save.mutateAsync(value);
        setInitial(value);
        formApi.reset(value);
        onSaved(true);
      } catch (error) {
        const fields = fieldErrors(error);
        if (fields.whatsapp) setServerError(formApi, 'whatsapp', t`Номер — 10 цифр после +7`);
        else if (fields.name) setServerError(formApi, 'name', t`Введите название`);
        else setFormError(formApi, messages.failed);
      }
    },
  });
  return form;
}

export type ShopInfoForm = ReturnType<typeof useShopInfoForm>;

/** Ошибки графика по дням — после первой попытки сохранить, по текущим значениям. */
export function useScheduleErrors(form: ShopInfoForm) {
  const attempted = useStore(form.store, (state) => state.submissionAttempts > 0);
  const values = useStore(form.store, (state) => state.values);
  return attempted ? validateShopInfo(values).days : {};
}
