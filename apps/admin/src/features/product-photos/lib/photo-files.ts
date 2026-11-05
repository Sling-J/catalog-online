import { PHOTO_MAX_BYTES } from '../constants';
import type { PhotoProblem } from '../types';

const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

/**
 * Тип фото для хранилища или `null`, если это не JPEG/PNG/WebP/HEIC. Браузер на Windows отдаёт HEIC без типа
 * (или как `application/octet-stream`) — тогда смотрим на расширение.
 */
export function photoContentType(file: Pick<File, 'name' | 'type'>): string | null {
  if (TYPES.includes(file.type)) return file.type;
  if (file.type && file.type !== 'application/octet-stream') return null;
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return BY_EXTENSION[extension] ?? null;
}

export type AcceptedPhoto = { file: File; contentType: string };

/**
 * Какие из выбранных файлов берём: подходящие по типу и размеру, не больше свободных мест. Про остальные —
 * одна причина, первая встреченная: показать все сразу негде.
 */
export function acceptPhotos(files: File[], free: number): { accepted: AcceptedPhoto[]; problem?: PhotoProblem } {
  const accepted: AcceptedPhoto[] = [];
  let problem: PhotoProblem | undefined;
  for (const file of files) {
    const contentType = photoContentType(file);
    if (!contentType) problem ??= 'type';
    else if (file.size > PHOTO_MAX_BYTES) problem ??= 'size';
    else if (accepted.length >= free) problem ??= 'limit';
    else accepted.push({ file, contentType });
  }
  return { accepted, problem };
}
