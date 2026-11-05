import { useRef, useState } from 'react';

import { uploadFile } from '@/shared/api';

import { PHOTO_LIMIT } from '../constants';
import { acceptPhotos } from '../lib';
import type { PhotoError, PhotoList, PhotoTile } from '../types';

import { type LocalUpload, newLocalUpload, withStatus } from './local-upload';
import { useBlobUrls } from './use-blob-urls';

/** Не все фото загрузились — сохранять товар без них молча нельзя. */
export class PhotosNotUploadedError extends Error {}

const TILE_STATE: Record<LocalUpload['status'], PhotoTile['state']> = {
  uploading: 'uploading',
  uploaded: 'ready',
  failed: 'upload-failed',
};

/**
 * Фото нового товара: товара ещё нет, поэтому файлы сразу едут в хранилище, а их `uploadId` по порядку уходят
 * в `createProduct` (`photoUploadIds`, решение основателя A24). Порядок и удаление — только на устройстве.
 */
export function useNewProductPhotos(): PhotoList & { uploadIds: () => Promise<string[]> } {
  const blobUrl = useBlobUrls();
  const [uploads, setUploads] = useState<LocalUpload[]>([]);
  const [error, setError] = useState<PhotoError>();
  // последние плитки — для `uploadIds`, который ждёт загрузки дольше одной отрисовки
  const latest = useRef(uploads);
  latest.current = uploads;
  const pending = useRef(new Map<string, Promise<void>>());
  const stored = useRef(new Map<string, string>());

  const send = (upload: LocalUpload) => {
    const done = uploadFile('product_photo', upload.file, upload.contentType).then(
      (uploadId) => {
        stored.current.set(upload.key, uploadId);
        setUploads(withStatus(upload.key, 'uploaded'));
      },
      () => {
        setUploads(withStatus(upload.key, 'failed'));
        setError('upload');
      },
    );
    pending.current.set(upload.key, done);
    void done.finally(() => pending.current.delete(upload.key));
  };

  const add = (files: File[]) => {
    const { accepted, problem } = acceptPhotos(files, PHOTO_LIMIT - uploads.length);
    setError(problem);
    const next = accepted.map((photo) => newLocalUpload(photo, blobUrl(photo.file)));
    setUploads((list) => [...list, ...next]);
    next.forEach(send);
  };

  const reorder = (ids: string[]) => {
    const byKey = new Map(uploads.map((item) => [item.key, item]));
    setUploads(ids.map((id) => byKey.get(id)!));
  };

  const remove = async (key: string) => {
    setError(undefined);
    stored.current.delete(key);
    setUploads((list) => list.filter((item) => item.key !== key));
  };

  const retry = (key: string) => {
    const upload = uploads.find((item) => item.key === key);
    if (!upload) return;
    setError(undefined);
    setUploads(withStatus(key, 'uploading'));
    send(upload);
  };

  /** Дождаться загрузок и отдать `uploadId` в порядке плиток; что-то не загрузилось — `PhotosNotUploadedError`. */
  const uploadIds = async (): Promise<string[]> => {
    await Promise.all(pending.current.values());
    const ids = latest.current.map((item) => stored.current.get(item.key));
    if (ids.some((id) => id === undefined)) {
      setError('upload');
      throw new PhotosNotUploadedError();
    }
    return ids as string[];
  };

  const tiles = uploads.map((upload): PhotoTile => ({
    id: upload.key,
    image: null,
    preview: upload.preview,
    state: TILE_STATE[upload.status],
    sortable: true,
  }));
  return { tiles, canAdd: uploads.length < PHOTO_LIMIT, error, add, reorder, remove, retry, uploadIds };
}
