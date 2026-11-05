import { createFormHook } from '@tanstack/react-form';

import { fieldContext, formContext } from './contexts';
import { FormServerError } from './form-server-error';
import { SubmitButton } from './submit-button';
import { TextField } from './text-field';

const { useAppForm: useBaseAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: { SubmitButton, FormServerError },
});

/**
 * Форма админки на TanStack Form (ADR 0003). Отправить можно и при ошибках: проверка формы всё равно не пустит
 * запрос, пока ошибки на клиенте, а ошибки сервера с прошлой попытки не мешают повторить (`submitForm`).
 */
export const useAppForm: typeof useBaseAppForm = (options) =>
  useBaseAppForm({ canSubmitWhenInvalid: true, ...options });

export { withForm };
