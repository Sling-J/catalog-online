import { cx, Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useRef, useState, type DragEvent, type ReactNode } from 'react';

import type { StartImportError } from '../../hooks';
import { Spinner } from '../spinner';

const ACCEPT = '.xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';
const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes('Files');

function UploadError({ error }: { error: StartImportError }) {
  return (
    <p role="alert" className="mt-2 text-[13px] text-coral-underside">
      {error === 'type' ? (
        <Trans>Нужен файл Excel (.xlsx) или CSV. Старый .xls сохраните заново как .xlsx.</Trans>
      ) : error === 'size' ? (
        <Trans>Файл больше 20 МБ — разделите его на части.</Trans>
      ) : (
        <Trans>Не получилось загрузить файл — проверьте связь и попробуйте ещё раз.</Trans>
      )}
    </p>
  );
}

/**
 * Шаг «Файл» (FR-A3, макета нет): поле «Выберите файл» пунктиром, как у фото товара; на компьютере файл можно
 * бросить на поле — оно обводится. Пока файл едет и API его читает — на месте поля имя файла и крутилка.
 * `aside` — подсказки и последний импорт: на телефоне под полем, на компьютере колонкой справа (340 px, как на шаге
 * «Колонки»).
 */
export function UploadStep({
  busy,
  error,
  onFile,
  aside,
}: {
  /** Файл едет или читается: имя и что происходит. */
  busy: { fileName: string; reading: boolean } | null;
  error: StartImportError | null;
  onFile: (file: File | undefined) => void;
  aside: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dropping, setDropping] = useState(false);

  const zone = busy ? (
    <div
      aria-live="polite"
      className="flex h-[180px] flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-[#e2dff0] bg-white px-4 text-center lg:h-[260px]"
    >
      <Spinner className="size-10 border-4" />
      <div className="min-w-0 max-w-full">
        <div className="truncate text-[15px] font-bold">{busy.fileName}</div>
        <div className="text-[13px] text-ink-quiet">
          {busy.reading ? <Trans>Читаем файл…</Trans> : <Trans>Загружаем файл…</Trans>}
        </div>
      </div>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        setDropping(true);
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={(event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        setDropping(false);
        onFile(event.dataTransfer.files[0]);
      }}
      className={cx(
        'flex h-[180px] w-full flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed px-4 text-center transition-colors lg:h-[260px]',
        dropping ? 'border-iris bg-[#ecebff]' : 'border-[#c9c3e3] bg-[#f8f7fd] hover:border-line-hover',
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-sun text-ink-night shadow-press-sun">
        <Icon name="upload" size={26} strokeWidth={2.2} />
      </span>
      <span className="mt-1 text-[16px] font-bold">
        <span className="lg:hidden">
          <Trans>Выберите файл</Trans>
        </span>
        <span className="hidden lg:inline">
          <Trans>
            Перетащите файл сюда или <span className="text-iris">выберите</span>
          </Trans>
        </span>
      </span>
      <span className="text-[13px] text-ink-quiet">
        <Trans>Excel (.xlsx) или CSV, до 20 МБ</Trans>
      </span>
    </button>
  );

  return (
    <div className="mt-4 lg:mt-[22px] lg:flex lg:gap-6">
      <div className="min-w-0 lg:flex-1">
        {zone}
        {error && <UploadError error={error} />}
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(event) => {
            onFile(event.target.files?.[0]);
            // тот же файл можно выбрать ещё раз
            event.target.value = '';
          }}
        />
      </div>
      <div className="mt-3.5 flex flex-col gap-2.5 lg:mt-0 lg:w-[340px] lg:flex-none lg:gap-3.5">{aside}</div>
    </div>
  );
}
