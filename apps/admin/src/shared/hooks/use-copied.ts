import { useCallback, useEffect, useState } from 'react';

const SHOW_MS = 2000;

/**
 * Копирование в буфер с отметкой «скопировано» на две секунды — для кнопок «Скопировать ссылку».
 * `copied` сбрасывается сам; повторное нажатие начинает отсчёт заново.
 */
export function useCopied(): { copied: boolean; copy: (text: string) => void } {
  const [copied, setCopied] = useState(0);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(0), SHOW_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = useCallback((text: string) => {
    void navigator.clipboard.writeText(text).then(() => setCopied((count) => count + 1));
  }, []);

  return { copied: copied > 0, copy };
}
