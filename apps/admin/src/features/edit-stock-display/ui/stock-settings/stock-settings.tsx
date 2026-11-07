import type { Shop } from '@catalog/contract';
import { cx, Switch } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { type ReactNode, useId } from 'react';

import { FormError } from '@/shared/ui';

import { THRESHOLD_MAX, THRESHOLD_MIN, useStockSettings } from '../../hooks';

const card = 'rounded-[20px] bg-white p-3.5';
const resting = 'shadow-[0_1px_0_#eceaf5]';

/**
 * «Наличие на витрине» (FR-A8; макет AdminPhone2, экран 11): что увидит покупатель, когда выберет размер, —
 * «есть / мало / нет» или точное количество (примеры плашек как в макете), порог «мало» и показ закончившихся.
 * Всё сохраняется сразу.
 */
export function StockSettings({ shop }: { shop: Shop }) {
  const { t } = useLingui();
  const settings = useStockSettings(shop);
  const mode = shop.stockDisplay;

  return (
    <>
      <p className="px-4 pt-4 text-[15px] leading-[1.5] text-ink-soft lg:px-0 lg:pt-[18px]">
        <Trans>Что увидит покупатель, когда выберет размер.</Trans>
      </p>

      <div
        role="radiogroup"
        aria-label={t`Как показывать наличие`}
        className="flex flex-col gap-2.5 px-4 pt-3.5 lg:px-0"
      >
        <ModeCard
          checked={mode === 'levels'}
          onSelect={() => settings.setMode('levels')}
          title={<Trans>Есть / мало / нет</Trans>}
          sub={<Trans>Точное количество не видно</Trans>}
        >
          <Pill tone="in">
            <Trans>В наличии</Trans>
          </Pill>
          <Pill tone="low">
            <Trans>Осталось мало</Trans>
          </Pill>
          <Pill tone="out">
            <Trans>Нет</Trans>
          </Pill>
        </ModeCard>
        <ModeCard
          checked={mode === 'exact'}
          onSelect={() => settings.setMode('exact')}
          title={<Trans>Точное количество</Trans>}
          sub={<Trans>Покупатель видит, сколько штук осталось</Trans>}
        >
          <Pill tone="in">
            <Trans>В наличии: 6 шт.</Trans>
          </Pill>
          <Pill tone="low">
            <Trans>Осталось 1 шт.</Trans>
          </Pill>
        </ModeCard>
      </div>

      <div className={cx(card, resting, 'mx-4 mt-4 flex items-center justify-between gap-3 lg:mx-0')}>
        <div>
          <div id="low-stock-title" className="text-[15px] font-bold">
            <Trans>«Мало» — это сколько?</Trans>
          </div>
          <div className="text-[13px] text-ink-quiet">
            <Trans>столько штук и меньше</Trans>
          </div>
        </div>
        <div
          role="group"
          aria-labelledby="low-stock-title"
          className="flex flex-none items-center gap-0.5 rounded-pill bg-[#f1effa] p-[3px]"
        >
          <StepButton
            label={t`Меньше`}
            disabled={settings.threshold <= THRESHOLD_MIN}
            onClick={() => settings.setThreshold(settings.threshold - 1)}
          >
            −
          </StepButton>
          <output aria-live="polite" className="min-w-7 text-center text-[17px] font-extrabold tabular-nums">
            {settings.threshold}
          </output>
          <StepButton
            label={t`Больше`}
            disabled={settings.threshold >= THRESHOLD_MAX}
            onClick={() => settings.setThreshold(settings.threshold + 1)}
          >
            +
          </StepButton>
        </div>
      </div>

      <div className={cx(card, resting, 'mx-4 mt-2.5 lg:mx-0')}>
        <Switch
          checked={shop.showOutOfStock}
          onCheckedChange={settings.setShowOutOfStock}
          className="text-left"
          label={
            <span className="block pr-3">
              <span className="block text-[15px] font-bold">
                <Trans>Показывать закончившиеся</Trans>
              </span>
              <span className="block text-[13px] leading-[17px] font-normal text-ink-quiet">
                <Trans>В конце списка, с пометкой «нет в наличии»</Trans>
              </span>
            </span>
          }
        />
      </div>

      {settings.failed && <FormError>{t`Не сохранилось. Проверьте интернет и попробуйте ещё раз.`}</FormError>}
    </>
  );
}

/** Карточка режима: кружок выбора, название, пояснение и примеры плашек. Выбранная обведена чернилами. */
function ModeCard({
  checked,
  title,
  sub,
  onSelect,
  children,
}: {
  checked: boolean;
  title: ReactNode;
  sub: ReactNode;
  onSelect: () => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-sub`}
      onClick={onSelect}
      className={cx(card, 'flex gap-3 text-left', checked ? 'shadow-[0_0_0_2px_var(--color-ink-night)]' : resting)}
    >
      <span
        aria-hidden="true"
        className={cx(
          'size-[22px] flex-none rounded-full',
          checked ? 'border-[7px] border-ink-night' : 'border-2 border-[#c9c3e3]',
        )}
      />
      <span className="flex-1">
        <span id={`${id}-title`} className="block text-[15px] font-bold">
          {title}
        </span>
        <span id={`${id}-sub`} className="mt-0.5 block text-[13px] text-ink-quiet">
          {sub}
        </span>
        <span className="mt-2.5 flex flex-wrap gap-1.5">{children}</span>
      </span>
    </button>
  );
}

const tones = {
  in: 'bg-[#e6fbf2] text-stock-in',
  low: 'bg-[#fff1d6] text-[#7a4300]',
  out: 'bg-[#f1effa] text-stock-out',
};

/** Пример плашки наличия, как в макете (без точки, у «мало» — тёмно-янтарный текст). */
function Pill({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex h-[26px] items-center rounded-pill px-2.5 text-[12px] font-bold whitespace-nowrap',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="press flex size-[34px] items-center justify-center rounded-full bg-white font-bold hover:bg-[#f8f7fd] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
