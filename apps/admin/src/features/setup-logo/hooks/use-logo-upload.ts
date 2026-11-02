import { createUpload, setShopLogo } from '@catalog/contract';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { applyShop } from '@/entities/shop';

import { LOGO_MAX_BYTES, LOGO_TYPES } from '@/features/setup-logo/constants';

export type LogoUploadError = 'type' | 'size' | 'failed';

/**
 * Загрузка логотипа (API2): ссылка на хранилище → файл туда `PUT` напрямую → `uploadId` в `PUT /shop/logo`.
 * Пока файл едет, показываем его сразу (`preview`); ошибка — превью убираем.
 */
export function useLogoUpload() {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState<LogoUploadError>();
  const [pending, setPending] = useState(false);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const upload = async (file: File) => {
    setError(undefined);
    if (!LOGO_TYPES.includes(file.type)) return setError('type');
    if (file.size > LOGO_MAX_BYTES) return setError('size');
    setPreview(URL.createObjectURL(file));
    setPending(true);
    try {
      const { data: target } = await createUpload({
        body: { purpose: 'logo', fileName: file.name, contentType: file.type, size: file.size },
        throwOnError: true,
      });
      // в хранилище, не в API: SDK тут ни при чём
      const stored = await fetch(target.url, {
        method: target.method,
        headers: { ...target.headers, 'Content-Type': file.type },
        body: file,
      });
      if (!stored.ok) throw new Error(`upload ${stored.status}`);
      const { data: shop } = await setShopLogo({ body: { uploadId: target.uploadId }, throwOnError: true });
      await applyShop(queryClient, shop);
      setPreview(undefined);
    } catch {
      setPreview(undefined);
      setError('failed');
    } finally {
      setPending(false);
    }
  };

  return { upload, preview, error, pending };
}
