import { Trans, useLingui } from '@lingui/react/macro';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import {
  CheckStep,
  FailedState,
  HintCard,
  MappingStep,
  ResultState,
  StepProgress,
  TemplateLink,
  TextAction,
  UploadStep,
  useImportActions,
  useStartImport,
  WorkingState,
} from '@/features/import-wizard';
import {
  formatImportDate,
  importQueryOptions,
  importsQueryOptions,
  ImportSummary,
  isImportOpen,
} from '@/entities/import';
import { invalidateProducts } from '@/entities/product';
import { statusOf } from '@/shared/api';
import { PageTitle } from '@/shared/ui';

/** Открыть импорт по id или вернуться к выбору файла (`undefined`). */
type OpenImport = (importId: string | undefined) => void;

/**
 * Раздел «Импорт» (FR-A3): «Файл → Колонки → Проверка → Готово». Открытый импорт живёт в адресе (`?id=`), шаг —
 * по его статусу с сервера, поэтому переживает перезагрузку и уход с экрана. Телефон — заголовок «Импорт» (макет
 * AdminPhone, экран 5), компьютер — «Импорт товаров» с «Историей импортов» и «Скачать шаблон» (макет AdminDesk,
 * экран 3). Пока прошлый импорт не закончен, раздел открывает его.
 */
export function ImportPage({ importId, onOpen }: { importId: string | undefined; onOpen: OpenImport }) {
  return (
    <>
      <PageTitle
        actions={
          <div className="hidden items-center gap-2.5 lg:flex">
            <HistoryLink />
            <TemplateLink />
          </div>
        }
      >
        <span className="lg:hidden">
          <Trans>Импорт</Trans>
        </span>
        <span className="hidden lg:inline">
          <Trans>Импорт товаров</Trans>
        </span>
      </PageTitle>
      {importId ? <OpenedImport key={importId} importId={importId} onOpen={onOpen} /> : <NewImport onOpen={onOpen} />}
    </>
  );
}

function HistoryLink({ className }: { className?: string }) {
  return (
    <Link to="/import/history" className={`text-[14px] font-semibold text-iris hover:underline ${className ?? ''}`}>
      <Trans>История импортов</Trans>
    </Link>
  );
}

/** Шаг «Файл»: выбрать файл. Если прошлый импорт не закончен — сразу к нему. */
function NewImport({ onOpen }: { onOpen: OpenImport }) {
  // список в кеше мог устареть (импорт только что отменили или применили) — решаем по свежему
  const { data, isFetching } = useInfiniteQuery({ ...importsQueryOptions(), refetchOnMount: 'always' });
  const latest = data?.pages[0]?.items[0];
  const open = !isFetching && latest && isImportOpen(latest.status) ? latest.id : undefined;
  useEffect(() => {
    if (open) onOpen(open);
  }, [open, onOpen]);
  const upload = useStartImport((item) => onOpen(item.id));
  return (
    <>
      <StepProgress step={1} />
      <UploadStep
        busy={upload.uploading && upload.fileName ? { fileName: upload.fileName, reading: false } : null}
        error={upload.error}
        onFile={upload.start}
        aside={<UploadAside />}
      />
    </>
  );
}

/** Подсказки к файлу и последний импорт (макета нет): под полем на телефоне, справа на компьютере. */
function UploadAside() {
  const { data } = useInfiniteQuery(importsQueryOptions());
  const last = data?.pages[0]?.items.find((item) => item.status === 'done' && item.result);
  return (
    <>
      <HintCard tone="note" title={<Trans>Как подготовить файл</Trans>}>
        <Trans>
          Одна строка — один вариант товара (размер, цвет). Нужны артикул, название, цена и остаток, остальные колонки
          станут атрибутами. Подойдёт и выгрузка из учётной программы — колонки сопоставим.
        </Trans>
        <TemplateLink className="mt-2 block lg:hidden" />
      </HintCard>
      {last?.result && (
        <HintCard tone="note" title={<Trans>Последний импорт</Trans>}>
          <span className="block truncate">{last.fileName}</span>
          <span className="block text-ink-quiet">
            {formatImportDate(last.createdAt)} · <ImportSummary result={last.result} />
          </span>
        </HintCard>
      )}
      <HistoryLink className="px-1 lg:hidden" />
    </>
  );
}

function OpenedImport({ importId, onOpen }: { importId: string; onOpen: OpenImport }) {
  const { t } = useLingui();
  const queryClient = useQueryClient();
  const { data: item, error, refetch } = useQuery(importQueryOptions(importId));
  const back = () => onOpen(undefined);
  const actions = useImportActions(importId, { onCancelled: back });
  const [editing, setEditing] = useState(false);
  const status = item?.status;

  // нет такого импорта или его отменили — к выбору файла; применили — товары и счётчики перечитать
  const missing = statusOf(error) === 404;
  useEffect(() => {
    if (missing || status === 'cancelled') onOpen(undefined);
    if (status === 'done') void invalidateProducts(queryClient);
  }, [missing, status, onOpen, queryClient]);

  if (!item) {
    if (error && !missing) {
      return (
        <FailedState title={t`Не получилось открыть импорт`} action={t`Повторить`} onAction={() => void refetch()} />
      );
    }
    return <WorkingState title={t`Открываем импорт…`} text={t`Секунду.`} />;
  }

  const otherFile = (
    <TextAction disabled={actions.cancel.isPending} onClick={() => actions.cancel.mutate()}>
      <Trans>Другой файл</Trans>
    </TextAction>
  );

  switch (item.status) {
    case 'parsing':
      return (
        <>
          <StepProgress step={1} />
          <UploadStep
            busy={{ fileName: item.fileName, reading: true }}
            error={null}
            onFile={() => {}}
            aside={<UploadAside />}
          />
        </>
      );
    case 'mapping':
      return (
        <>
          <StepProgress step={2} />
          <MappingStep
            item={item}
            fileAction={otherFile}
            pending={actions.mapping.isPending}
            failed={actions.mapping.isError}
            onSubmit={(mapping) => actions.mapping.mutate(mapping)}
          />
        </>
      );
    case 'previewing':
      return (
        <>
          <StepProgress step={3} />
          <WorkingState
            title={t`Проверяем строки…`}
            text={t`Считаем, сколько товаров появится и обновится, и ищем ошибки. Обычно это несколько секунд.`}
          />
        </>
      );
    case 'previewed':
      if (editing || !item.preview) {
        return (
          <>
            <StepProgress step={2} />
            <MappingStep
              item={item}
              fileAction={
                <TextAction onClick={() => setEditing(false)}>
                  <Trans>Отмена</Trans>
                </TextAction>
              }
              pending={actions.mapping.isPending}
              failed={actions.mapping.isError}
              onSubmit={(mapping) => actions.mapping.mutate(mapping, { onSuccess: () => setEditing(false) })}
            />
          </>
        );
      }
      return (
        <>
          <StepProgress step={3} />
          <CheckStep
            item={{ ...item, preview: item.preview }}
            fileAction={otherFile}
            pending={actions.apply.isPending}
            failed={actions.apply.isError}
            onEditColumns={item.headers?.length ? () => setEditing(true) : undefined}
            onApply={(zeroMissing) => actions.apply.mutate(zeroMissing)}
          />
        </>
      );
    case 'applying':
      return (
        <>
          <StepProgress step={4} />
          <WorkingState
            title={t`Загружаем товары…`}
            text={t`Можно уйти с этого экрана — загрузка продолжится, итог будет в истории импортов.`}
          />
        </>
      );
    case 'done':
      return (
        <>
          <StepProgress step={4} finished />
          {item.result && <ResultState item={{ ...item, result: item.result }} onAgain={back} />}
        </>
      );
    case 'failed':
      return (
        <FailedState
          title={t`Не получилось прочитать файл`}
          code={item.failureCode ?? null}
          action={t`Выбрать другой файл`}
          onAction={back}
        />
      );
    case 'cancelled':
      return null;
  }
}
