import { cx, formatPrice } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import type { Dispatch } from 'react';

import { orderLines, orderTotal, type DemoAction, type DemoState } from '@/pages/landing/lib';

import { PhoneFrame } from './phone-frame';

const chatButton = 'puffy min-h-12 flex-1 rounded-pill p-[15px] text-[15px] font-bold';

/** Телефон магазина: чат WhatsApp, куда приходит заказ, и ответ покупателю. */
export function WhatsappPhone({ state, dispatch }: { state: DemoState; dispatch: Dispatch<DemoAction> }) {
  const arrived = state.phase === 'sent' || state.phase === 'answered';

  return (
    <PhoneFrame tone="night">
      <div className="flex h-full flex-col overflow-hidden rounded-[41px] bg-[#f2efe8]">
        <div className="flex items-center gap-2.5 border-b border-[#ece8df] bg-white px-[18px] pt-5 pb-3.5">
          <div className="size-9 rounded-full bg-[linear-gradient(140deg,#b8ffe1,var(--color-mint-underside))]" />
          <div>
            <div className="text-[15px] font-bold">
              <Trans>Новый покупатель</Trans>
            </div>
            <div className="text-[12px] text-[#8a8576]">
              <Trans>заказ с сайта</Trans>
            </div>
          </div>
        </div>

        <div
          aria-live="polite"
          className="flex flex-1 flex-col gap-2.5 px-3.5 py-[18px] text-[14px] leading-[1.5] tabular-nums"
        >
          {arrived ? (
            <>
              <div className="max-w-[92%] self-start rounded-[20px_20px_20px_6px] bg-white px-4 py-3.5 shadow-[0_2px_4px_rgb(0_0_0/0.05)] motion-safe:animate-arrive">
                <div className="font-bold">
                  <Trans>Здравствуйте! Заказ с сайта Айгерим Kids:</Trans>
                </div>
                {orderLines(state).map((line, index) => (
                  <div key={line.name}>
                    {index + 1}. {line.name} (110) × {line.quantity} — {formatPrice(line.sum)}
                  </div>
                ))}
                <div className="mt-1.5 font-bold">
                  <Trans>Итого: {formatPrice(orderTotal(state))}</Trans>
                </div>
              </div>
              {state.phase === 'answered' && (
                <>
                  <div className="max-w-[85%] self-end rounded-[20px_20px_6px_20px] bg-[#d9fdd3] px-3.5 py-[11px] motion-safe:animate-arrive">
                    <Trans>Здравствуйте! Всё есть, ждём вас в ТЦ «Мега», 2 этаж</Trans>
                  </div>
                  <div className="self-center rounded-pill bg-mint/25 px-3 py-1.5 text-[12px] font-semibold text-stock-in motion-safe:animate-arrive">
                    <Trans>Дальше — обычная переписка в WhatsApp</Trans>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="m-auto max-w-[22ch] text-center text-[14px] text-[#8a8576]">
              <Trans>Здесь появится заказ, когда покупатель его отправит</Trans>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-3 pb-3">
          {state.phase === 'sent' && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'answer' })}
              className={cx(chatButton, 'bg-mint text-mint-ink shadow-[0_5px_0_var(--color-mint-underside)]')}
            >
              <Trans>Ответить покупателю</Trans>
            </button>
          )}
          {state.phase === 'answered' && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'reset' })}
              className={cx(chatButton, 'bg-white text-ink-night shadow-[0_5px_0_#d9d3c4]')}
            >
              <Trans>Ещё раз</Trans>
            </button>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
