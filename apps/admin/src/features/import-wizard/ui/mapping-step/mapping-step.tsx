import type { ColumnMapping, Import } from '@catalog/contract';
import { Button, useIsDesktop } from '@catalog/ui';
import { Plural, Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { attributesQueryOptions } from '@/entities/attribute';

import { useTargetLabels } from '../../hooks';
import { missingTargets, repeatedTargets, REQUIRED_TARGETS } from '../../lib';
import { FileHead } from '../file-head';
import { HintCard } from '../hint-card';
import { PhoneAction } from '../phone-action';
import { TargetSelect } from '../target-select';

const GRID = 'grid grid-cols-[1fr_1fr_40px_1.1fr] items-center gap-3 px-[18px]';

/** Пример значения колонки — первое непустое из первых строк файла. */
const exampleOf = (item: Import, column: string) =>
  item.sampleRows?.map((row) => row[column]?.trim()).find(Boolean) ?? '';

const isRequired = (mapping: ColumnMapping) => (REQUIRED_TARGETS as string[]).includes(mapping.target);

function RequiredMark() {
  return (
    <span className="flex-none text-[12px] font-bold whitespace-nowrap text-stock-in">
      <Trans>обязательно ✓</Trans>
    </span>
  );
}

/**
 * Шаг «Колонки» (FR-A3): заголовки файла не совпали с шаблоном — человек выбирает, куда загрузить каждую колонку.
 * Компьютер — макет AdminDesk, экран 3: таблица «Колонка в файле → Пример → Куда загрузить», справа — готово ли
 * сопоставление, «Запомним» и «Новая колонка — новый атрибут», внизу «Дальше: проверка →». Телефон (макета нет) —
 * те же строки карточками друг под другом, пояснения под ними, кнопка над меню. Не хватает обязательного поля или
 * одно поле выбрано дважды — карточка коралловая, «Дальше» неактивна.
 */
export function MappingStep({
  item,
  fileAction,
  pending,
  failed,
  onSubmit,
}: {
  item: Import;
  /** Справа от имени файла: «Другой файл» или «Отмена» (правка колонок с проверки). */
  fileAction: ReactNode;
  pending: boolean;
  failed: boolean;
  onSubmit: (mapping: ColumnMapping[]) => void;
}) {
  const isDesktop = useIsDesktop();
  const { data: attributes = [] } = useQuery({
    ...attributesQueryOptions(),
    select: (list) => list.map((attribute) => attribute.name),
  });
  const columns = item.headers ?? [];
  const [mapping, setMapping] = useState<ColumnMapping[]>(() =>
    columns.map(
      (column) =>
        item.mapping?.find((entry) => entry.column === column) ?? { column, target: 'skip', attributeName: null },
    ),
  );
  const change = (next: ColumnMapping) =>
    setMapping((current) => current.map((entry) => (entry.column === next.column ? next : entry)));
  const missing = missingTargets(mapping);
  const repeated = repeatedTargets(mapping);
  const ready = missing.length === 0 && repeated.length === 0;
  const rows = item.rowCount ?? 0;

  const note = (
    <>
      <Plural value={rows} one="# строка" few="# строки" other="# строк" />
      {' · '}
      <Trans>заголовки не совпали с шаблоном — укажите, что где</Trans>
    </>
  );
  const hints = <MappingHints mapping={mapping} missing={missing} repeated={repeated} />;
  const next = (
    <Button variant="primary" size="form" block disabled={!ready || pending} onClick={() => onSubmit(mapping)}>
      <Trans>Дальше: проверка →</Trans>
    </Button>
  );
  const error = failed && (
    <p role="alert" className="text-[13px] text-coral-underside">
      <Trans>Не получилось сохранить — проверьте связь и попробуйте ещё раз.</Trans>
    </p>
  );

  if (!isDesktop) {
    return (
      <>
        {/* как на проверке: у файла справа пусто, действие — под пояснениями */}
        <FileHead card name={item.fileName} note={note} className="mt-4" />
        <h2 className="mt-3.5 text-[15px] font-bold">
          <Trans>Куда загрузить колонки</Trans>
        </h2>
        <ul className="mt-2 rounded-[16px] border-[1.5px] border-[#e2dff0] bg-white">
          {mapping.map((entry) => (
            <li key={entry.column} className="border-t border-[#f0eef7] px-3 py-2.5 first:border-t-0">
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-[14px]">
                  <b className="font-semibold">{entry.column}</b>
                  <span className="text-ink-quiet"> · {exampleOf(item, entry.column)}</span>
                </span>
                {isRequired(entry) && <RequiredMark />}
              </div>
              <TargetSelect item={entry} attributes={attributes} onChange={change} className="mt-2 flex w-full" />
            </li>
          ))}
        </ul>
        <div className="mt-3.5 flex flex-col gap-2.5">{hints}</div>
        <div className="mt-4 flex">{fileAction}</div>
        {error && <div className="mt-2.5">{error}</div>}
        <PhoneAction>{next}</PhoneAction>
      </>
    );
  }

  return (
    <div className="mt-[22px] flex gap-6">
      <div className="min-w-0 flex-1 overflow-hidden rounded-[24px] bg-white shadow-[0_1px_0_#eceaf5,0_6px_16px_rgb(40_30_110/0.05)]">
        <FileHead name={item.fileName} note={note} action={fileAction} />
        <div className={`${GRID} py-2 text-[12px] font-semibold text-ink-quiet`}>
          <span>
            <Trans>Колонка в файле</Trans>
          </span>
          <span>
            <Trans>Пример</Trans>
          </span>
          <span />
          <span>
            <Trans>Куда загрузить</Trans>
          </span>
        </div>
        {mapping.map((entry) => (
          <div key={entry.column} className={`${GRID} border-t border-[#f0eef7] py-2.5 text-[14px]`}>
            <span className="truncate font-semibold">{entry.column}</span>
            <span className="truncate text-ink-quiet">{exampleOf(item, entry.column)}</span>
            <span className="text-ink-muted">→</span>
            <span className="flex min-w-0 items-center gap-2">
              <TargetSelect item={entry} attributes={attributes} onChange={change} />
              {isRequired(entry) && <RequiredMark />}
            </span>
          </div>
        ))}
      </div>
      <div className="flex w-[340px] flex-none flex-col gap-3.5">
        {hints}
        <span className="flex-1" />
        {error}
        {next}
      </div>
    </div>
  );
}

function MappingHints({
  mapping,
  missing,
  repeated,
}: {
  mapping: ColumnMapping[];
  missing: ReturnType<typeof missingTargets>;
  repeated: ReturnType<typeof repeatedTargets>;
}) {
  const labels = useTargetLabels();
  const lower = (targets: typeof missing) => targets.map((target) => labels[target].toLowerCase()).join(', ');
  // как в макете: колонка, ставшая атрибутом (своим или уже существующим, «Размер» → «Рост»)
  const created = mapping.filter((entry) => entry.target === 'attribute');
  const first = created[0];
  const quoted = created.map((entry) => `«${entry.column}»`).join(', ');
  const missingList = lower(missing);
  const repeatedList = lower(repeated);
  return (
    <>
      {missing.length > 0 ? (
        <HintCard tone="problem" title={<Trans>Не хватает: {missingList}</Trans>}>
          <Trans>Выберите, в каких колонках они лежат: без них товары не загрузить.</Trans>
        </HintCard>
      ) : repeated.length > 0 ? (
        <HintCard tone="problem" title={<Trans>Выбрано дважды: {repeatedList}</Trans>}>
          <Trans>Оставьте у одной колонки, у остальных — «Не загружать» или атрибут.</Trans>
        </HintCard>
      ) : (
        <HintCard tone="ok" title={<Trans>Все обязательные поля найдены</Trans>}>
          <Trans>Артикул, название, цена и остаток. Можно переходить к проверке.</Trans>
        </HintCard>
      )}
      <HintCard tone="note" title={<Trans>Запомним это сопоставление</Trans>}>
        <Trans>В следующий раз такой файл загрузится сразу, без этого шага.</Trans>
      </HintCard>
      {first && (
        <HintCard tone="note" title={<Trans>Новая колонка — новый атрибут</Trans>}>
          {created.length > 1 ? (
            <Trans>{quoted} станут атрибутами: по ним покупатели фильтруют на витрине.</Trans>
          ) : (
            <NewAttributeText column={first.column} name={first.attributeName ?? first.column} />
          )}
        </HintCard>
      )}
    </>
  );
}

function NewAttributeText({ column, name }: { column: string; name: string }) {
  return column === name ? (
    <Trans>«{column}» станет атрибутом: по нему покупатели фильтруют на витрине.</Trans>
  ) : (
    <Trans>
      «{column}» станет атрибутом «{name}»: по нему покупатели фильтруют на витрине.
    </Trans>
  );
}
