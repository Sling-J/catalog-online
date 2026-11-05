import type { ReactNode } from 'react';

import { FormError } from '../../form-error';
import { useFormContext } from '../contexts';

/** Ошибка всей формы под кнопкой (`setFormError`): нет связи, слишком много попыток. */
export function FormServerError() {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.errorMap.onSubmit as ReactNode}>
      {(error) => (typeof error === 'string' ? <FormError>{error}</FormError> : null)}
    </form.Subscribe>
  );
}
