import { cx } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import type { PhotoError } from '../../types';

/** Почему фото не добавилось или не сохранилось — на месте подсказки под фото, как у логотипа в мастере. */
export function PhotoErrorText({ error, className }: { error: PhotoError; className?: string }) {
  const text = {
    type: <Trans>Нужны фото JPG, PNG, WebP или HEIC</Trans>,
    size: <Trans>Фото больше 15 МБ — выберите поменьше</Trans>,
    limit: <Trans>Можно до 10 фото — лишние не добавили</Trans>,
    upload: <Trans>Не все фото загрузились — нажмите на фото, чтобы повторить</Trans>,
    reorder: <Trans>Не получилось поменять порядок — попробуйте ещё раз</Trans>,
    delete: <Trans>Не получилось удалить фото — попробуйте ещё раз</Trans>,
  }[error];
  return (
    <p role="alert" className={cx('text-[12px] text-coral-underside', className)}>
      {text}
    </p>
  );
}
