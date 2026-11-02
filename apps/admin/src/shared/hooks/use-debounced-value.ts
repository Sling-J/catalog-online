import { useEffect, useState } from 'react';

/** Значение с задержкой: меняется, когда ввод затих на `ms` миллисекунд (проверка адреса на лету). */
export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}
