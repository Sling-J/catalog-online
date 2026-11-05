import { addProductPhoto, deleteProductPhoto, type Photo, type Product, reorderProductPhotos } from '@catalog/contract';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { invalidateProducts, productQueryOptions } from '@/entities/product';
import { uploadFile } from '@/shared/api';

import { PHOTO_LIMIT, PHOTO_POLL_MS } from '../constants';
import { acceptPhotos } from '../lib';
import type { PhotoError, PhotoList, PhotoTile } from '../types';

import { type LocalUpload, newLocalUpload, withStatus } from './local-upload';
import { useBlobUrls } from './use-blob-urls';

/**
 * Фото в карточке товара (FR-A4): сохраняются сразу, без «Сохранить» (решение основателя, A24). Файл едет в
 * хранилище, потом прикрепляется к товару — по очереди, чтобы фото встали в порядке выбора. Порядок и удаление —
 * сразу запросом, новый порядок виден до ответа. Пока фото сжимаются (`processing`), товар перечитывается, а на
 * плитке — файл с устройства.
 */
export function useProductPhotos(product: Product): PhotoList & { busy: boolean } {
  const queryClient = useQueryClient();
  const options = productQueryOptions(product.id);
  const path = { productId: product.id };
  useQuery({
    ...options,
    refetchInterval: (query) =>
      query.state.data?.photos.some((photo) => photo.status === 'processing') ? PHOTO_POLL_MS : false,
  });
  const blobUrl = useBlobUrls();
  const [uploads, setUploads] = useState<LocalUpload[]>([]);
  // превью с устройства у уже прикреплённых фото — пока сервер их сжимает
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [error, setError] = useState<PhotoError>();
  const queue = useRef(Promise.resolve());

  const photos = product.photos;
  const setPhotos = async (update: (photos: Photo[]) => Photo[]) => {
    // перечитывание товара не должно затереть то, что ещё не дошло до сервера
    await queryClient.cancelQueries({ queryKey: options.queryKey });
    queryClient.setQueryData(options.queryKey, (old) => old && { ...old, photos: update(old.photos) });
  };

  const send = (upload: LocalUpload) => {
    const stored = uploadFile('product_photo', upload.file, upload.contentType);
    stored.catch(() => undefined); // ошибку разберём в очереди
    queue.current = queue.current.then(async () => {
      try {
        const { data: photo } = await addProductPhoto({ path, body: { uploadId: await stored }, throwOnError: true });
        await setPhotos((list) => [...list, photo]);
        setPreviews((map) => ({ ...map, [photo.id]: upload.preview }));
        setUploads((list) => list.filter((item) => item.key !== upload.key));
        void invalidateProducts(queryClient);
      } catch {
        setUploads(withStatus(upload.key, 'failed'));
        setError('upload');
      }
    });
  };

  const add = (files: File[]) => {
    const { accepted, problem } = acceptPhotos(files, PHOTO_LIMIT - photos.length - uploads.length);
    setError(problem);
    const next = accepted.map((photo) => newLocalUpload(photo, blobUrl(photo.file)));
    setUploads((list) => [...list, ...next]);
    next.forEach(send);
  };

  const reorder = (ids: string[]) => {
    const before = photos;
    const byId = new Map(photos.map((photo) => [photo.id, photo]));
    setError(undefined);
    void setPhotos(() => ids.map((id, position) => ({ ...byId.get(id)!, position })));
    reorderProductPhotos({ path, body: { photoIds: ids }, throwOnError: true }).then(
      ({ data }) => {
        void setPhotos(() => data);
        void invalidateProducts(queryClient);
      },
      () => {
        void setPhotos(() => before);
        setError('reorder');
      },
    );
  };

  const remove = async (id: string) => {
    setError(undefined);
    if (uploads.some((item) => item.key === id)) {
      setUploads((list) => list.filter((item) => item.key !== id));
      return;
    }
    try {
      await deleteProductPhoto({ path: { ...path, photoId: id }, throwOnError: true });
    } catch (cause) {
      setError('delete');
      throw cause;
    }
    await setPhotos((list) =>
      list.filter((photo) => photo.id !== id).map((photo, position) => ({ ...photo, position })),
    );
    void invalidateProducts(queryClient);
  };

  const retry = (key: string) => {
    const upload = uploads.find((item) => item.key === key);
    if (!upload) return;
    setError(undefined);
    setUploads(withStatus(key, 'uploading'));
    send(upload);
  };

  const tiles: PhotoTile[] = [
    ...photos.map((photo): PhotoTile => ({
      id: photo.id,
      image: photo.image,
      preview: previews[photo.id],
      state: photo.status === 'failed' ? 'processing-failed' : photo.status,
      sortable: true,
    })),
    ...uploads.map((upload): PhotoTile => ({
      id: upload.key,
      image: null,
      preview: upload.preview,
      state: upload.status === 'failed' ? 'upload-failed' : 'uploading',
      sortable: false,
    })),
  ];
  return {
    tiles,
    canAdd: photos.length + uploads.length < PHOTO_LIMIT,
    error,
    add,
    reorder,
    remove,
    retry,
    busy: uploads.some((item) => item.status === 'uploading'),
  };
}
