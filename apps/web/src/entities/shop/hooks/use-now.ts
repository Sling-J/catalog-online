import { useEffect, useState } from 'react';

/** Текущее время, обновляется раз в минуту: для «Открыто до…» и выделения сегодняшнего дня. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
