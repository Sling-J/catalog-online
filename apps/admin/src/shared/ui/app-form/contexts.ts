import { createFormHookContexts } from '@tanstack/react-form';

// Контексты формы и поля: через них поля и кнопки формы знают, к какой форме привязаны
export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();
