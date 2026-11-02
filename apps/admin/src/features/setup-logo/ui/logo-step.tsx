import type { Image } from '@catalog/contract';
import { Button, Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, type ChangeEvent, type DragEvent, type ReactNode } from 'react';

import { ShopAvatar } from '@/entities/shop';

import { useLogoUpload, type LogoUploadError } from '@/features/setup-logo/hooks';

/**
 * Мастер, шаг 4 — логотип (макет AdminPhone2 / AdminDesk2; загруженный — AdminSetupStates). Телефон: «Снять»
 * и «Из галереи». Компьютер: перетащить картинку или выбрать файл. Без логотипа — буквы из названия.
 */
export function LogoStep({
  name,
  logo,
  onPendingChange,
}: {
  name: string;
  logo: Image | null;
  onPendingChange: (pending: boolean) => void;
}) {
  const { t } = useLingui();
  const { upload, preview, error, pending } = useLogoUpload();
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);

  const start = (file: File | undefined) => {
    if (!file) return;
    onPendingChange(true);
    void upload(file).finally(() => onPendingChange(false));
  };
  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    start(event.target.files?.[0]);
    event.target.value = '';
  };
  const drop = (event: DragEvent) => {
    event.preventDefault();
    start(event.dataTransfer.files[0]);
  };

  const shown: Image | null = preview
    ? { width: 1, height: 1, sizes: { '320': preview, '640': preview, '1280': preview } }
    : logo;
  const hint = error ? <UploadError error={error} /> : null;

  return (
    <>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
      <input
        ref={gallery}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
        hidden
        onChange={pick}
      />

      {/* телефон */}
      <div className="mt-6 flex flex-col items-center gap-3.5 rounded-[26px] border-2 border-dashed border-[#c9c3e3] bg-[#f8f7fd] px-4 py-[26px] lg:hidden">
        <ShopAvatar name={name} logo={shown} size="xl" />
        <div className="flex gap-2">
          <Button variant="soft" size="small" disabled={pending} onClick={() => camera.current?.click()}>
            <Icon name="camera" size={18} />
            <Trans>Снять</Trans>
          </Button>
          <Button variant="soft" size="small" disabled={pending} onClick={() => gallery.current?.click()}>
            <Icon name="image" size={18} />
            <Trans>Из галереи</Trans>
          </Button>
        </div>
        {hint ?? (
          <div className="text-[12px] text-ink-muted">
            <Trans>PNG или JPG, квадрат от 400 px</Trans>
          </div>
        )}
      </div>

      {/* компьютер */}
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={drop}
        aria-label={t`Логотип: перетащите картинку сюда`}
        className="mt-8 hidden items-center gap-5 rounded-[26px] border-2 border-dashed border-[#c9c3e3] bg-[#f8f7fd] p-[22px] lg:flex"
      >
        <ShopAvatar name={name} logo={shown} size="lg" />
        <div>
          <div className="text-[16px] font-bold">
            <Trans>Перетащите картинку сюда</Trans>
          </div>
          <div className="mt-1 text-[14px] text-ink-quiet">
            {hint ?? (
              <Trans>
                или{' '}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => gallery.current?.click()}
                  className="font-bold text-iris"
                >
                  выберите файл
                </button>{' '}
                · PNG, JPG, квадрат от 400 px
              </Trans>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function UploadError({ error }: { error: LogoUploadError }): ReactNode {
  const text = {
    type: <Trans>Нужна картинка PNG или JPG</Trans>,
    size: <Trans>Картинка больше 15 МБ — выберите поменьше</Trans>,
    failed: <Trans>Не получилось загрузить — попробуйте ещё раз</Trans>,
  }[error];
  return (
    <span role="alert" className="text-[12px] text-coral-underside lg:text-[14px]">
      {text}
    </span>
  );
}
