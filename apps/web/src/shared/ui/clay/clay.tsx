import type { CSSProperties, ReactNode } from 'react';

export type ClayTone = 'sun' | 'coral' | 'mint';

const tones: Record<ClayTone, { light: string; base: string; dark: string; ink: string }> = {
  sun: { light: '#fff0a8', base: '#ffd23f', dark: '#e3ae00', ink: '#6b4e00' },
  coral: { light: '#ffc9b5', base: '#ff8f6b', dark: '#d9532f', ink: '#5a1e0b' },
  mint: { light: '#b8ffe2', base: '#5ee6b0', dark: '#26b985', ink: '#0b3a28' },
};

// предметы парят, а при «меньше движения» стоят на месте
const float = 'motion-safe:animate-clay-float';

/**
 * Пластилиновый предмет для пустых и служебных состояний (3D-иллюстрации — позже): брусок с дыркой
 * и подписью — «?», размер, «скоро».
 */
const blockSizes = {
  // на компьютере предмет крупнее (макет «Пустые и служебные состояния — компьютер»)
  md: {
    box: 'h-[100px] w-[80px] rounded-[18px] lg:h-[120px] lg:w-[96px] lg:rounded-[22px]',
    hole: 'mt-3 size-4 lg:mt-3.5 lg:size-[18px]',
    label: 'mt-2.5 text-[22px] lg:mt-3 lg:text-[26px]',
  },
  xl: {
    box: 'h-[240px] w-[192px] rounded-[22px]',
    hole: 'mt-3.5 size-[18px]',
    label: 'mt-3 text-[26px]',
  },
};

export function ClayBlock({
  tone = 'sun',
  rotate = 0,
  label,
  size = 'md',
}: {
  tone?: ClayTone;
  rotate?: number;
  label: string;
  size?: keyof typeof blockSizes;
}) {
  const sizes = blockSizes[size];
  const color = tones[tone];
  return (
    <div
      aria-hidden="true"
      className={`${float} mx-auto ${sizes.box}`}
      style={
        {
          '--r': `${rotate}deg`,
          background: `radial-gradient(120% 90% at 30% 15%, ${color.light}, ${color.base} 55%, ${color.dark})`,
          boxShadow:
            'inset -8px -12px 18px rgb(80 40 0 / 0.28), inset 7px 8px 14px rgb(255 255 255 / 0.55), 0 20px 30px rgb(60 30 120 / 0.22)',
        } as CSSProperties
      }
    >
      <div
        className={`mx-auto rounded-full bg-paper ${sizes.hole}`}
        style={{ boxShadow: 'inset 2px 2px 4px rgb(0 0 0 / 0.15)' }}
      />
      <p className={`text-center leading-[1.2] font-extrabold ${sizes.label}`} style={{ color: color.ink }}>
        {label}
      </p>
    </div>
  );
}

/** Облачко с «!» — для «нет связи» и ошибок. */
export function ClayCloud({ rotate = 0 }: { rotate?: number }) {
  const lilac = 'radial-gradient(120% 120% at 30% 20%, #ffffff, #e4dcff 60%, #b9a9f5)';
  return (
    <div
      aria-hidden="true"
      className={`${float} relative mx-auto h-[84px] w-[132px] lg:h-[100px] lg:w-[160px]`}
      style={{ '--r': `${rotate}deg` } as CSSProperties}
    >
      <div
        className="absolute bottom-0 left-2 h-[54px] w-[116px] rounded-full lg:left-2.5 lg:h-16 lg:w-[140px]"
        style={{
          background: lilac,
          boxShadow: 'inset -8px -10px 16px rgb(80 60 170 / 0.25), 0 18px 28px rgb(60 30 120 / 0.2)',
        }}
      />
      <div
        className="absolute top-0 left-[34px] size-16 rounded-full lg:left-[42px] lg:size-[76px]"
        style={{ background: lilac, boxShadow: 'inset -6px -8px 14px rgb(80 60 170 / 0.22)' }}
      />
      <p className="absolute inset-x-0 top-[34px] text-center text-[22px] font-extrabold text-iris lg:top-[42px] lg:text-[26px]">
        !
      </p>
    </div>
  );
}

/** Мятное облачко-реплика с подписью — «Отправлено ✓». */
export function ClayBubble({ children, rotate = -3 }: { children: ReactNode; rotate?: number }) {
  return (
    <div
      aria-hidden="true"
      className={`${float} inline-block rounded-[28px_28px_28px_8px] px-6 py-4 text-[24px] font-extrabold text-mint-ink tabular-nums lg:rounded-[30px_30px_30px_8px] lg:px-7 lg:py-[18px] lg:text-[28px]`}
      style={
        {
          '--r': `${rotate}deg`,
          background: 'radial-gradient(120% 120% at 30% 15%, #b8ffe2, #5ee6b0 55%, #26b985)',
          boxShadow:
            'inset -8px -10px 16px rgb(0 60 40 / 0.25), inset 6px 6px 12px rgb(255 255 255 / 0.5), 0 20px 30px rgb(20 90 60 / 0.25)',
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
