import { Field } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState, type ReactNode } from 'react';

import { ContactField, phoneDigits, phoneText, ScheduleSheet, ScheduleSummary } from '@/features/edit-shop-info';
import { BackBar, clearServerError, FieldNote, TextAreaField } from '@/shared/ui';

import type { ShopInfoView } from '../../types';
import { LogoPicker } from '../logo-picker';

/**
 * «О магазине» на телефоне (макет AdminPhone2, экран 9): «Назад» и «Готово» сверху, логотип, описание, адрес,
 * как найти, график кратко (правка — шторкой, в макете её нет), контакты.
 */
export function PhoneShopInfo({ shop, form, onSubmit }: ShopInfoView) {
  const { t } = useLingui();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  return (
    <form noValidate onSubmit={onSubmit}>
      <BackBar
        to="/shop"
        action={
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(submitting) => (
              <button
                type="submit"
                disabled={submitting}
                className="text-[15px] font-bold text-iris disabled:opacity-60"
              >
                <Trans>Готово</Trans>
              </button>
            )}
          </form.Subscribe>
        }
      >
        <Trans>О магазине</Trans>
      </BackBar>
      <div className="flex flex-col gap-3 px-4 pt-4">
        <LogoPicker name={shop.name ?? ''} logo={shop.logo ?? null} />
        {/* в макете поля нет — добавлено по решению основателя 2026-11-08 (A27), как на компьютере */}
        <form.AppField name="name">{(field) => <field.TextField label={t`Название`} maxLength={80} />}</form.AppField>
        <form.Field name="description">
          {(field) => <TextAreaField label={t`Описание`} value={field.state.value} onChange={field.handleChange} />}
        </form.Field>
        <form.Field name="address">
          {(field) => (
            <Field
              label={t`Адрес`}
              maxLength={200}
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          )}
        </form.Field>
        <form.Field name="howToFind">
          {(field) => (
            <TextAreaField
              label={t`Как найти`}
              note={<FieldNote>{t`необязательно`}</FieldNote>}
              maxLength={300}
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>
      </div>
      <div className="px-4 pt-3.5">
        <ScheduleSummary form={form} timezone={shop.timezone} onEdit={() => setScheduleOpen(true)} />
      </div>
      <div className="px-4 pt-3.5">
        <h2 className="text-[15px] font-bold">
          <Trans>Контакты</Trans>
        </h2>
        <div className="mt-2 flex flex-col gap-2">
          <form.Field name="whatsapp">
            {(field) => (
              <ContactField
                name="WhatsApp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+7 700 000 00 00"
                value={phoneText(field.state.value)}
                error={field.state.meta.errors[0] as ReactNode}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(phoneDigits(event.target.value));
                  clearServerError(form, 'whatsapp');
                }}
              />
            )}
          </form.Field>
          <form.Field name="instagram">
            {(field) => (
              <ContactField
                name="Instagram"
                placeholder="@"
                maxLength={60}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            )}
          </form.Field>
        </div>
      </div>
      <div className="px-4">
        <form.AppForm>
          <form.FormServerError />
        </form.AppForm>
      </div>
      <ScheduleSheet form={form} timezone={shop.timezone} open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    </form>
  );
}
