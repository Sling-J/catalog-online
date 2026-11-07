import type { Image } from '@catalog/contract';
import { cx, Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, type DragEvent, type ReactNode } from 'react';

import { LOGO_TYPES, type LogoUploadError, useLogoUpload } from '@/features/setup-logo';
import { ShopAvatar } from '@/entities/shop';

const errorText: Record<LogoUploadError, ReactNode> = {
  type: <Trans>Нужна картинка: JPG, PNG, WebP или HEIC</Trans>,
  size: <Trans>Файл больше 15 МБ — выберите поменьше</Trans>,
  failed: <Trans>Не загрузилось. Проверьте интернет и попробуйте ещё раз.</Trans>,
};

/**
 * Логотип в «О магазине»: сохраняется сразу, без «Сохранить» (как фото товара, A24). Телефон — круг 64 px и
 * «Сменить логотип» (макет AdminPhone2, экран 9). Компьютер — только круг рядом с названием (AdminDesk2, экран 7):
 * нажатие открывает выбор файла, можно перетащить картинку; при наведении — значок камеры (в макете нет).
 */
export function LogoPicker({
  name,
  logo,
  desktop,
  children,
}: {
  name: string;
  logo: Image | null;
  desktop?: boolean;
  /** Компьютер: поле «Название» справа от круга. */
  children?: ReactNode;
}) {
  const { t } = useLingui();
  const input = useRef<HTMLInputElement>(null);
  const { upload, preview, error, pending } = useLogoUpload();
  const shown: Image | null = preview
    ? { width: 1, height: 1, sizes: { '320': preview, '640': preview, '1280': preview } }
    : logo;
  const start = (file: File | undefined) => {
    if (file) void upload(file);
  };
  const drop = (event: DragEvent) => {
    event.preventDefault();
    start(event.dataTransfer.files[0]);
  };
  const avatar = <ShopAvatar name={name} logo={shown} size="info" className={cx(pending && 'opacity-60')} />;

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={LOGO_TYPES.join(',')}
        hidden
        onChange={(event) => {
          start(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      {desktop ? (
        <div>
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              aria-label={t`Сменить логотип`}
              aria-busy={pending || undefined}
              onClick={() => input.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={drop}
              className="group relative flex-none rounded-full"
            >
              {avatar}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink-night/40 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Icon name="camera" size={22} />
              </span>
            </button>
            <div className="min-w-0 flex-1">{children}</div>
          </div>
          {error && (
            <p role="alert" className="mt-1.5 text-[13px] text-coral-underside">
              {errorText[error]}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3.5">
          {avatar}
          <div>
            <button
              type="button"
              aria-busy={pending || undefined}
              onClick={() => input.current?.click()}
              className="text-[15px] font-semibold text-iris"
            >
              <Trans>Сменить логотип</Trans>
            </button>
            <div className={cx('text-[12px]', error ? 'text-coral-underside' : 'text-ink-muted')}>
              {error ? errorText[error] : <Trans>Квадрат, от 400 px</Trans>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
