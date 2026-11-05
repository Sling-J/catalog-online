import { useEffect, useRef } from 'react';

/** Ссылки `blob:` на файлы с устройства для превью; все освобождаются, когда экран закрыт. */
export function useBlobUrls() {
  const urls = useRef<string[]>([]);
  useEffect(() => {
    const list = urls.current;
    return () => list.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  return (file: File): string => {
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    return url;
  };
}
