import type { AcceptedPhoto } from '../lib';

/** Файл с устройства, пока он едет в хранилище. */
export type LocalUpload = AcceptedPhoto & {
  key: string;
  preview: string;
  status: 'uploading' | 'uploaded' | 'failed';
};

export const newLocalUpload = (photo: AcceptedPhoto, preview: string): LocalUpload => ({
  ...photo,
  key: `local-${crypto.randomUUID()}`,
  preview,
  status: 'uploading',
});

export const withStatus =
  (key: string, status: LocalUpload['status']) =>
  (list: LocalUpload[]): LocalUpload[] =>
    list.map((item) => (item.key === key ? { ...item, status } : item));
