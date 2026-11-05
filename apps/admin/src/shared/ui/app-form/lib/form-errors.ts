import type { AnyFormApi } from '@tanstack/react-form';

/**
 * Ошибка сервера у поля («Неверная почта или пароль», «Каталог с этой почтой уже есть»). Лежит под ключом
 * `onServer`: проверка формы её не трогает, снимают правка поля (поля формы) и новая отправка (`submitForm`).
 */
export function setServerError(form: AnyFormApi, name: string, error: unknown): void {
  form.setFieldMeta(name, (meta) => ({ ...meta, errorMap: { ...meta?.errorMap, onServer: error } }));
}

/** Снять ошибку сервера у поля — когда его правят. */
export function clearServerError(form: AnyFormApi, name: string): void {
  if (form.getFieldMeta(name)?.errorMap.onServer === undefined) return;
  form.setFieldMeta(name, (meta) => ({ ...meta, errorMap: { ...meta.errorMap, onServer: undefined } }));
}

/** Ошибка всей формы («Не получилось. Проверьте интернет…»): показывает `FormServerError`, снимает новая отправка. */
export function setFormError(form: AnyFormApi, error: unknown): void {
  form.setErrorMap({ onSubmit: error });
}

/**
 * Отправка: сначала снимаем ошибки сервера с прошлой попытки, потом проверка и `onSubmit` формы. `meta` — что
 * нажали, если кнопок отправки несколько («Черновик» / «Сохранить и показать»).
 */
export function submitForm(form: AnyFormApi, meta?: unknown): Promise<void> {
  for (const name of Object.keys(form.state.fieldMeta)) clearServerError(form, name);
  return meta === undefined ? form.handleSubmit() : form.handleSubmit(meta);
}

/** Ответ проверки формы при отправке: ошибки только у полей, где они есть; нет ни одной — форма в порядке. */
export function invalidFields(fields: Record<string, unknown>): { fields: Record<string, unknown> } | undefined {
  const found = Object.fromEntries(Object.entries(fields).filter(([, error]) => error !== undefined && error !== ''));
  return Object.keys(found).length > 0 ? { fields: found } : undefined;
}
