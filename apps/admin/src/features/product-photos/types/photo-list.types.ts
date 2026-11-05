import type { Image } from '@catalog/contract';

/** Почему фото не взяли: не тот тип, больше 15 МБ, уже 10 фото. */
export type PhotoProblem = 'type' | 'size' | 'limit';

/** Что сказать под фото: отказ при выборе или сбой запроса. */
export type PhotoError = PhotoProblem | 'upload' | 'reorder' | 'delete';

/**
 * Состояние плитки: готово; сжимается на сервере; ещё едет в хранилище; не загрузилось (можно повторить);
 * сервер не смог обработать (только удалить).
 */
export type PhotoTileState = 'ready' | 'processing' | 'uploading' | 'upload-failed' | 'processing-failed';

/** Плитка фото — сохранённое у товара или ещё загружаемое. */
export type PhotoTile = {
  id: string;
  /** Картинка с сервера; нет — пока сжимается или ещё не загружена. */
  image: Image | null;
  /** Файл с устройства (`blob:`), пока нет картинки с сервера. HEIC браузер может не показать. */
  preview?: string;
  state: PhotoTileState;
  /** Можно ли перетаскивать: загружаемое в карточку товара ещё не прикреплено. */
  sortable: boolean;
};

/** Фото товара для плиток: что показать и что с ними можно сделать. */
export type PhotoList = {
  tiles: PhotoTile[];
  /** Ещё есть место (меньше 10). */
  canAdd: boolean;
  error?: PhotoError;
  add: (files: File[]) => void;
  /** Новый порядок сортируемых плиток; первая — обложка. */
  reorder: (ids: string[]) => void;
  remove: (id: string) => Promise<void>;
  retry: (id: string) => void;
};
