import { Field } from '@catalog/ui';
import type { ReactNode } from 'react';

import { formatPhone, PHONE_DIGITS } from '@/entities/shop';
import { clearServerError } from '@/shared/ui';

import type { ShopInfoForm } from '../../hooks';
import { phoneDigits, phoneText } from '../../lib';

/** WhatsApp с подписью над полем (компьютер): «+7 700 000 00 00», в форме — 10 цифр. */
export function WhatsappField({ form, label }: { form: ShopInfoForm; label: ReactNode }) {
  return (
    <form.Field name="whatsapp">
      {(field) => (
        <Field
          label={label}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={`+7 ${formatPhone('7000000000')}`}
          value={phoneText(field.state.value)}
          error={field.state.meta.errors[0] as ReactNode}
          maxLength={3 + PHONE_DIGITS + 3}
          onBlur={field.handleBlur}
          onChange={(event) => {
            field.handleChange(phoneDigits(event.target.value));
            clearServerError(form, 'whatsapp');
          }}
        />
      )}
    </form.Field>
  );
}
