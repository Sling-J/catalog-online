import { Button, Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { TemplateLink } from '../template-link';

function Reason({ code }: { code: string | null | undefined }) {
  switch (code) {
    case 'too_many_rows':
      return <Trans>В файле больше 20 000 строк — разделите его на части и загрузите по очереди.</Trans>;
    case 'no_required_columns':
      return <Trans>В файле не нашлось колонок с артикулом, названием, ценой и остатком.</Trans>;
    case 'too_large':
      return (
        <Trans>
          Файл слишком тяжёлый, чтобы его прочитать. Оставьте в нём один лист с товарами, уберите картинки и оформление
          или разделите на части.
        </Trans>
      );
    case 'no_rows':
      return <Trans>В файле есть заголовки, но нет строк с товарами. Заполните его и загрузите ещё раз.</Trans>;
    case 'unreadable_file':
      return (
        <Trans>Файл повреждён или это не таблица. Откройте его в Excel, сохраните как .xlsx и загрузите ещё раз.</Trans>
      );
    default:
      return <Trans>Что-то пошло не так при чтении файла. Попробуйте загрузить его ещё раз.</Trans>;
  }
}

/**
 * Файл не прочитался или не загрузился (FR-A3, макета нет): коралловый знак, причина по `failureCode`,
 * «Выбрать другой файл» и «Скачать шаблон». Без `code` — сбой связи: «Повторить».
 */
export function FailedState({
  title,
  code,
  action,
  onAction,
}: {
  title: ReactNode;
  code?: string | null;
  action: ReactNode;
  onAction: () => void;
}) {
  return (
    <div role="alert" className="mx-auto mt-8 flex max-w-[430px] flex-col items-center text-center lg:mt-14">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#ffe9e1] text-coral-underside">
        <Icon name="warning" size={30} strokeWidth={2.2} />
      </span>
      <h2 className="mt-4 text-title">{title}</h2>
      <p className="mt-2 text-[15px] leading-normal text-ink-quiet">
        {code === undefined ? (
          <Trans>Проверьте связь с интернетом и попробуйте ещё раз.</Trans>
        ) : (
          <Reason code={code} />
        )}
      </p>
      <Button variant="primary" size="form" block onClick={onAction} className="mt-6">
        {action}
      </Button>
      {code !== undefined && <TemplateLink className="mt-4" />}
    </div>
  );
}
