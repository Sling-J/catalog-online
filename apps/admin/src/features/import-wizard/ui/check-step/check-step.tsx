import type { Import } from '@catalog/contract';
import { Button, Switch, useIsDesktop } from '@catalog/ui';
import { Plural, Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { IMPORT_ERRORS_SHOWN, importErrorsQueryOptions } from '@/entities/import';

import { FileHead } from '../file-head';
import { PhoneAction } from '../phone-action';
import { RowErrorText } from '../row-error-text';
import { StatTile } from '../stat-tile';
import { TextAction } from '../text-action';

type Preview = NonNullable<Import['preview']>;

/**
 * Шаг «Проверка» (FR-A3): сколько товаров появится и обновится, ошибки по строкам (их пропустим) и «Обнулить
 * остаток у N товаров, которых нет в файле» (по умолчанию включено). Телефон — макет AdminPhone, экран 5, кнопка
 * «Загрузить N строк» над меню. Компьютер (макета нет) — как «Колонки»: слева файл и ошибки, справа плитки,
 * переключатель и кнопка. Ошибок нет — мятная строка вместо списка; обнулять нечего — переключателя нет.
 */
export function CheckStep({
  item,
  fileAction,
  pending,
  failed,
  onEditColumns,
  onApply,
}: {
  item: Import & { preview: Preview };
  fileAction: ReactNode;
  pending: boolean;
  failed: boolean;
  /** «Изменить колонки» — если API знает заголовки файла. */
  onEditColumns?: () => void;
  onApply: (zeroMissing: boolean) => void;
}) {
  const isDesktop = useIsDesktop();
  const { preview } = item;
  const [zeroMissing, setZeroMissing] = useState(true);
  const toLoad = preview.rows - preview.errors;

  const note = (
    <>
      <Plural value={preview.rows} one="# строка" few="# строки" other="# строк" />
      {item.mappingRemembered && (
        <>
          {' · '}
          <Trans>колонки как в прошлый раз</Trans>
        </>
      )}
    </>
  );
  const tiles = (
    <div className="flex gap-2">
      <StatTile
        tone="create"
        value={preview.create}
        label={<Plural value={preview.create} one="новый" other="новых" />}
      />
      <StatTile tone="update" value={preview.update} label={<Trans>обновится</Trans>} />
      <StatTile
        tone="errors"
        value={preview.errors}
        label={<Plural value={preview.errors} one="ошибка" few="ошибки" other="ошибок" />}
      />
    </div>
  );
  const missing = preview.missingInFile;
  const zero = missing > 0 && (
    <Switch
      checked={zeroMissing}
      onCheckedChange={setZeroMissing}
      className="text-left"
      label={
        <span className="block">
          <span className="block text-[14px] leading-[normal] font-semibold">
            <Plural
              value={missing}
              one="Обнулить остаток у # товара, которого нет в файле"
              other="Обнулить остаток у # товаров, которых нет в файле"
            />
          </span>
          <span className="block text-[12px] leading-[normal] font-normal text-ink-muted">
            <Trans>Иначе останутся старые остатки</Trans>
          </span>
        </span>
      }
    />
  );
  const button = (
    // в макете цифры в кнопке обычные, у Button — моноширинные
    <Button
      variant="primary"
      size="form"
      block
      disabled={pending || toLoad === 0}
      onClick={() => onApply(zeroMissing)}
      className="[font-variant-numeric:normal]"
    >
      {toLoad === 0 ? (
        <Trans>Нечего загружать</Trans>
      ) : (
        <Plural value={toLoad} one="Загрузить # строку" few="Загрузить # строки" other="Загрузить # строк" />
      )}
    </Button>
  );
  const error = failed && (
    <p role="alert" className="text-[13px] text-coral-underside">
      <Trans>Не получилось начать загрузку — проверьте связь и попробуйте ещё раз.</Trans>
    </p>
  );
  const editColumns = onEditColumns && (
    <TextAction onClick={onEditColumns}>
      <Trans>Изменить колонки</Trans>
    </TextAction>
  );

  if (!isDesktop) {
    // в макете у файла на телефоне справа пусто — действия строкой под содержимым
    return (
      <>
        <FileHead card name={item.fileName} note={note} className="mt-4" />
        <div className="mt-3">{tiles}</div>
        <RowErrors item={item} className="mt-3.5" />
        {/* flex: переключатель строчный, в обычном блоке он встал бы на базовую линию и сдвинулся */}
        {zero && <div className="mt-3.5 flex">{zero}</div>}
        <div className="mt-4 flex gap-5">
          {editColumns}
          {fileAction}
        </div>
        {error && <div className="mt-2.5">{error}</div>}
        <PhoneAction>{button}</PhoneAction>
      </>
    );
  }

  return (
    <div className="mt-[22px] flex gap-6">
      <div className="min-w-0 flex-1 self-start overflow-hidden rounded-[24px] bg-white pb-[18px] shadow-[0_1px_0_#eceaf5,0_6px_16px_rgb(40_30_110/0.05)]">
        <FileHead name={item.fileName} note={note} action={fileAction} />
        <RowErrors item={item} className="px-[18px]" />
      </div>
      <div className="flex w-[340px] flex-none flex-col gap-3.5">
        {tiles}
        {zero && <div className="flex rounded-[24px] bg-white p-[18px] shadow-[0_1px_0_#eceaf5]">{zero}</div>}
        {editColumns && <div className="px-1">{editColumns}</div>}
        <span className="flex-1" />
        {error}
        {button}
      </div>
    </div>
  );
}

/** «Строки с ошибками пропустим» и список; ошибок нет — так и пишем. Больше 50 — «и ещё N». */
function RowErrors({ item, className }: { item: Import & { preview: Preview }; className?: string }) {
  const total = item.preview.errors;
  const { data, isError } = useQuery({ ...importErrorsQueryOptions(item.id), enabled: total > 0 });
  if (total === 0) {
    return (
      <div className={className}>
        <div className="rounded-[16px] bg-mint-soft px-3 py-2.5 text-[13px] font-semibold text-mint-ink">
          <Trans>Ошибок нет — загрузим все строки</Trans>
        </div>
      </div>
    );
  }
  const errors = data?.items ?? [];
  const more = total - Math.min(errors.length, IMPORT_ERRORS_SHOWN);
  return (
    <div className={className}>
      <h2 className="text-[15px] font-bold">
        <Trans>Строки с ошибками пропустим</Trans>
      </h2>
      <ul className="mt-2 rounded-[16px] border-[1.5px] border-[#e2dff0] bg-white text-[13px] leading-[1.4]">
        {errors.map((error) => (
          <li key={`${error.row}-${error.code}`} className="border-t border-[#f0eef7] px-3 py-2.5 first:border-t-0">
            <b>
              <Trans>Строка {error.row}</Trans>
            </b>
            {' · '}
            <RowErrorText error={error} />
          </li>
        ))}
        {!data && (
          <li className="px-3 py-2.5 text-ink-muted">
            {isError ? <Trans>Не получилось загрузить список ошибок</Trans> : <Trans>Загружаем список…</Trans>}
          </li>
        )}
        {data && more > 0 && (
          <li className="border-t border-[#f0eef7] px-3 py-2.5 text-ink-muted">
            <Plural value={more} one="и ещё # строка" few="и ещё # строки" other="и ещё # строк" />
          </li>
        )}
      </ul>
    </div>
  );
}
