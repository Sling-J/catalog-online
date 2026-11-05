import { Button, type ButtonProps } from '@catalog/ui';

import { useFormContext } from '../contexts';

/** Кнопка отправки формы (`form.AppForm` → `form.SubmitButton`): пока форма отправляется, неактивна. */
export function SubmitButton({ disabled, ...props }: Omit<ButtonProps, 'type'>) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => <Button type="submit" disabled={disabled || isSubmitting} {...props} />}
    </form.Subscribe>
  );
}
