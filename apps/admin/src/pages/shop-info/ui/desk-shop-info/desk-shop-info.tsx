import { Button, Field, Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { ScheduleCard, WhatsappField } from '@/features/edit-shop-info';
import { FieldNote, PageTitle, TextAreaField } from '@/shared/ui';

import type { ShopInfoView } from '../../types';
import { LogoPicker } from '../logo-picker';

/**
 * «О магазине» на компьютере (макет AdminDesk2, экран 7): «Магазин / О магазине», заголовок с «Превью витрины» и
 * «Сохранить»; слева сведения, справа график ровной сеткой. Уже 1280 px колонки идут друг под другом.
 */
export function DeskShopInfo({
  shop,
  form,
  onSubmit,
  previewOpen,
  onTogglePreview,
}: ShopInfoView & { previewOpen: boolean; onTogglePreview: () => void }) {
  const { t } = useLingui();
  return (
    <form noValidate onSubmit={onSubmit}>
      <div className="text-[14px] text-ink-quiet">
        <Link to="/shop" className="hover:text-ink-night">
          <Trans>Магазин</Trans>
        </Link>{' '}
        / <Trans>О магазине</Trans>
      </div>
      <div className="mt-1.5">
        <PageTitle
          actions={
            <>
              <Button
                variant={previewOpen ? 'soft' : 'line'}
                size="compact"
                className="px-[18px]!"
                aria-expanded={previewOpen}
                onClick={onTogglePreview}
              >
                <Icon name="eye" size={18} />
                {previewOpen ? <Trans>Скрыть превью</Trans> : <Trans>Превью витрины</Trans>}
              </Button>
              <form.AppForm>
                <form.SubmitButton size="compact">
                  <Trans>Сохранить</Trans>
                </form.SubmitButton>
              </form.AppForm>
            </>
          }
        >
          <Trans>О магазине</Trans>
        </PageTitle>
      </div>
      <div className="mt-[18px] flex flex-col gap-8 xl:grid xl:grid-cols-[1fr_480px]">
        <div className="flex flex-col gap-3.5">
          <LogoPicker desktop name={shop.name ?? ''} logo={shop.logo ?? null}>
            <form.AppField name="name">
              {(field) => <field.TextField label={t`Название`} maxLength={80} />}
            </form.AppField>
          </LogoPicker>
          <form.Field name="description">
            {(field) => <TextAreaField label={t`Описание`} value={field.state.value} onChange={field.handleChange} />}
          </form.Field>
          <form.Field name="address">
            {(field) => (
              <Field
                label={t`Адрес`}
                note={<span className="text-iris">{t`ссылка на 2ГИС найдётся сама`}</span>}
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
          <div className="grid grid-cols-2 gap-3.5">
            <WhatsappField form={form} label={t`WhatsApp`} />
            <form.Field name="instagram">
              {(field) => (
                <Field
                  label={t`Instagram`}
                  placeholder="@"
                  maxLength={60}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              )}
            </form.Field>
          </div>
          <form.AppForm>
            <form.FormServerError />
          </form.AppForm>
        </div>
        <ScheduleCard form={form} timezone={shop.timezone} />
      </div>
    </form>
  );
}
