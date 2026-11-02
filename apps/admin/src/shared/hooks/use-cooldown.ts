import { useEffect, useState } from 'react';

/** Обратный отсчёт в секундах для «Отправить ещё раз»: `start()` запускает, `left` — сколько осталось (0 — можно). */
export function useCooldown(seconds: number): { left: number; start: () => void } {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  return { left, start: () => setLeft(seconds) };
}
