import { cx } from '@catalog/ui';
import type { ReactNode } from 'react';

const tones = {
  create: 'bg-mint-soft text-mint-ink',
  update: 'bg-[#ece9ff] text-[#2a2290]',
  errors: 'bg-[#ffe9e1] text-[#8a2e12]',
  zeroed: 'bg-chip-haze text-ink-quiet',
} as const;

/**
 * Плитка с числом: «12 новых», «203 обновится», «3 ошибки» (макет AdminPhone, экран 5); «обнулено» — серая,
 * ошибок ноль — тоже серая (тревожиться не о чем).
 */
export function StatTile({ tone, value, label }: { tone: keyof typeof tones; value: number; label: ReactNode }) {
  return (
    <div className={cx('flex-1 rounded-[18px] p-3', tones[tone === 'errors' && value === 0 ? 'zeroed' : tone])}>
      <div className="text-[24px] font-extrabold tabular-nums">{value}</div>
      <div className="text-[12px] font-semibold">{label}</div>
    </div>
  );
}
