import { type AnyFormApi, useStore } from '@tanstack/react-form';

/** Есть ли правки: значения отличаются от исходных (вернули как было — правок нет). */
export function useIsDirty(form: AnyFormApi): boolean {
  return useStore(form.store, (state) => !state.isDefaultValue);
}
