import { createUpload } from '@catalog/contract';

export type UploadPurpose = 'product_photo' | 'logo' | 'import';

/**
 * Файл в хранилище напрямую (API2): ссылка из `createUpload` → `PUT` туда → `uploadId` для нужного запроса.
 * `contentType` — когда браузер не знает тип файла (HEIC на Windows приходит без него).
 */
export async function uploadFile(purpose: UploadPurpose, file: File, contentType = file.type): Promise<string> {
  const { data: target } = await createUpload({
    body: { purpose, fileName: file.name, contentType, size: file.size },
    throwOnError: true,
  });
  // в хранилище, не в API: SDK тут ни при чём
  const stored = await fetch(target.url, {
    method: target.method,
    headers: { ...target.headers, 'Content-Type': contentType },
    body: file,
  });
  if (!stored.ok) throw new Error(`upload ${stored.status}`);
  return target.uploadId;
}
