import { cx } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useReducer, type CSSProperties, type ReactNode } from 'react';

import { demoReducer, FLIGHT_MS, initialDemoState, type DemoView } from '@/pages/landing/lib';

import { BuyerPhone } from './buyer-phone';
import { WhatsappPhone } from './whatsapp-phone';

// пластилиновые предметы — заглушки под 3D (макет N); при «меньше движения» стоят на месте
const clay = (light: string, base: string, dark: string, shade: string) => ({
  background: `radial-gradient(120% 90% at 30% 20%, ${light}, ${base} 55%, ${dark})`,
  boxShadow: `inset -10px -14px 22px ${shade}, inset 9px 10px 18px rgb(255 255 255 / 0.45), 0 30px 40px rgb(60 30 120 / 0.25)`,
});

/**
 * Интерактивный пример (FR-L1, макет N): слева телефон покупателя, справа — WhatsApp магазина, между ними
 * летит заказ. До 720 px — один телефон и вкладки «Покупатель / Ваш WhatsApp»; после отправки открывается WhatsApp.
 */
export function Demo() {
  const { t } = useLingui();
  const [state, dispatch] = useReducer(demoReducer, initialDemoState);

  useEffect(() => {
    if (state.phase !== 'flying') return;
    const id = setTimeout(() => dispatch({ type: 'arrived' }), FLIGHT_MS);
    return () => clearTimeout(id);
  }, [state.phase]);

  const tabs: { id: DemoView; label: string }[] = [
    { id: 'buyer', label: t`Покупатель` },
    { id: 'shop', label: state.phase === 'sent' ? t`Ваш WhatsApp · 1` : t`Ваш WhatsApp` },
  ];

  return (
    <section id="demo" aria-label={t`Интерактивный пример`} className="relative mx-auto max-w-[1200px] px-6 pt-16">
      <div
        role="group"
        aria-label={t`Чей экран показать`}
        className="relative z-[3] mx-auto mb-[22px] hidden w-fit max-w-full justify-center gap-1.5 rounded-pill border border-white/85 bg-white/50 p-1.5 backdrop-blur-[16px] max-[720px]:flex"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={state.view === tab.id}
            onClick={() => dispatch({ type: 'view', view: tab.id })}
            className={cx(
              'min-h-11 rounded-pill px-5 py-3 text-[15px] font-semibold transition-[background-color,color,box-shadow] duration-250 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink-night',
              state.view === tab.id
                ? 'bg-ink-night text-white shadow-[0_4px_0_var(--color-ink-underside)]'
                : 'text-ink-night',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* сумка, бирка «110» и мячик парят вокруг телефонов */}
      <div
        aria-hidden="true"
        className="absolute top-10 left-[1%] h-[132px] w-[120px] rounded-[26px_26px_34px_34px] motion-safe:animate-float-lg max-[1000px]:scale-75 max-[720px]:top-24 max-[720px]:-left-3.5 max-[720px]:size-16 max-[720px]:opacity-85"
        style={{ '--r': '-12deg', ...clay('#ffb39c', '#ff7a59', '#d9532f', 'rgb(120 30 0 / 0.35)') } as CSSProperties}
      >
        <div className="absolute -top-[38px] left-1/2 -ml-[31px] box-border size-[62px] rotate-45 rounded-full border-[11px] border-[#e96440] border-b-transparent" />
      </div>
      <div
        aria-hidden="true"
        className="absolute top-5 right-[2%] h-[132px] w-[100px] rounded-[20px] motion-safe:animate-float-lg max-[1000px]:scale-75 max-[720px]:hidden"
        style={
          {
            '--r': '14deg',
            animationDuration: '6.6s',
            animationDelay: '0.8s',
            ...clay('#fff0a8', '#ffd23f', '#e3ae00', 'rgb(130 90 0 / 0.35)'),
          } as CSSProperties
        }
      >
        <div className="mx-auto mt-4 size-5 rounded-full bg-lilac-field shadow-[inset_3px_4px_7px_rgb(29_27_75/0.35)]" />
        <div className="mt-3 text-center text-[24px] font-extrabold text-[#6b4e00]">110</div>
      </div>
      <div
        aria-hidden="true"
        className="absolute bottom-[60px] left-[4%] size-[76px] rounded-full motion-safe:animate-float-lg max-[1000px]:scale-75 max-[720px]:right-[-10px] max-[720px]:bottom-[180px] max-[720px]:left-auto max-[720px]:size-16 max-[720px]:opacity-85"
        style={
          {
            '--r': '10deg',
            animationDuration: '6s',
            animationDelay: '1.5s',
            ...clay('#b8ffe1', '#5ee6b0', '#26b985', 'rgb(0 90 60 / 0.3)'),
          } as CSSProperties
        }
      />

      <div className="flex flex-wrap items-center justify-center gap-7">
        <Device label={<Trans>Покупатель</Trans>} active={state.view === 'buyer'}>
          <BuyerPhone state={state} dispatch={dispatch} />
        </Device>

        <div
          aria-hidden="true"
          className="relative flex h-[60px] w-[120px] items-center justify-center max-[1000px]:w-11 max-[720px]:hidden"
        >
          {state.phase === 'flying' ? (
            <div className="size-11 rounded-full bg-[radial-gradient(120%_120%_at_25%_15%,#b8ffe1,#5ee6b0_55%,#26b985)] shadow-[inset_-5px_-6px_10px_rgb(0_90_60/0.3),0_10px_18px_rgb(60_30_120/0.25)] motion-safe:animate-fly" />
          ) : (
            <svg
              viewBox="0 0 80 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="2 9"
              className="w-20 max-[1000px]:w-10"
            >
              <path d="M4 12h66" />
              <path d="M62 4l10 8-10 8" strokeDasharray="none" />
            </svg>
          )}
        </div>

        <Device label={<Trans>Ваш WhatsApp</Trans>} active={state.view === 'shop'}>
          <WhatsappPhone state={state} dispatch={dispatch} />
        </Device>
      </div>
      <p className="mt-[22px] text-center text-[13px] text-ink-quiet">
        <Trans>Пример. Товары и цены вымышлены, объёмные предметы — заглушки под 3D</Trans>
      </p>
    </section>
  );
}

/** Телефон с подписью над ним; до 720 px виден только выбранный во вкладках. */
function Device({ label, active, children }: { label: ReactNode; active: boolean; children: ReactNode }) {
  return (
    <div
      className={cx(
        // на телефоне — во всю ширину, иначе корпус сжимается по содержимому (пустой чат уже сетки товаров)
        'relative z-[1] flex max-w-full flex-col items-center gap-3.5 max-[720px]:w-full',
        !active && 'max-[720px]:hidden',
      )}
    >
      <div className="rounded-pill bg-white/50 px-4 py-2 text-[15px] font-bold backdrop-blur-[12px] max-[720px]:hidden">
        {label}
      </div>
      {children}
    </div>
  );
}
