import { cx, Icon } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { Fragment } from 'react';

import type { ImportStep } from '@/entities/import';

type StepState = 'done' | 'current' | 'next';

const stateOf = (step: number, current: ImportStep, finished: boolean): StepState =>
  finished || step < current ? 'done' : step === current ? 'current' : 'next';

function Circle({ step, state, className }: { step: number; state: StepState; className: string }) {
  return (
    <span
      className={cx(
        'flex flex-none items-center justify-center rounded-full text-[13px] font-bold',
        state === 'done' && 'bg-mint text-mint-ink',
        state === 'current' && 'bg-ink-night text-white',
        state === 'next' && 'bg-chip-haze text-ink-muted',
        className,
      )}
    >
      {state === 'done' ? <Icon name="check" size={15} strokeWidth={3} /> : step}
    </span>
  );
}

/**
 * Шаги импорта «Файл → Колонки → Проверка → Готово»: пройденные — мятные с галочкой, текущий — тёмный с номером.
 * Телефон — четыре колонки с подписью под кружком (макет AdminPhone, экран 5), компьютер — строка с черточками
 * между шагами (макет AdminDesk, экран 3). `finished` — импорт применён, все четыре пройдены.
 */
export function StepProgress({ step, finished = false }: { step: ImportStep; finished?: boolean }) {
  const { t } = useLingui();
  const labels = [t`Файл`, t`Колонки`, t`Проверка`, t`Готово`];
  return (
    <>
      <ol className="mt-4 flex lg:hidden">
        {labels.map((label, index) => {
          const state = stateOf(index + 1, step, finished);
          return (
            <li
              key={label}
              aria-current={state === 'current' ? 'step' : undefined}
              className={cx(
                'flex flex-1 flex-col items-center gap-1.5 text-[11px] font-semibold',
                state === 'next' ? 'text-ink-muted' : 'text-ink-night',
              )}
            >
              <Circle step={index + 1} state={state} className="size-7" />
              {label}
            </li>
          );
        })}
      </ol>
      <ol className="mt-[18px] hidden items-center gap-[18px] lg:flex">
        {labels.map((label, index) => {
          const state = stateOf(index + 1, step, finished);
          return (
            <Fragment key={label}>
              {index > 0 && (
                <li aria-hidden="true" className={cx('h-0.5 w-10', state === 'next' ? 'bg-chip-haze' : 'bg-mint')} />
              )}
              <li
                aria-current={state === 'current' ? 'step' : undefined}
                className={cx(
                  'flex items-center gap-2 text-[14px] font-semibold',
                  state === 'next' ? 'text-ink-muted' : 'text-ink-night',
                )}
              >
                <Circle step={index + 1} state={state} className="size-[30px]" />
                {label}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </>
  );
}
