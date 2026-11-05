import { Field, type FieldProps } from '@catalog/ui';
import type { ReactNode } from 'react';

import { useFieldContext } from '../contexts';
import { clearServerError } from '../lib';

/**
 * Поле ввода, привязанное к полю формы (`form.AppField` → `field.TextField`): значение, ошибка (первая — из
 * проверки или от сервера), правка снимает ошибку сервера.
 */
export function TextField(props: Omit<FieldProps, 'value' | 'onChange' | 'onBlur' | 'error' | 'name'>) {
  const field = useFieldContext<string>();
  return (
    <Field
      {...props}
      name={field.name}
      value={field.state.value}
      error={field.state.meta.errors[0] as ReactNode}
      onBlur={field.handleBlur}
      onChange={(event) => {
        field.handleChange(event.target.value);
        clearServerError(field.form, field.name);
      }}
    />
  );
}
