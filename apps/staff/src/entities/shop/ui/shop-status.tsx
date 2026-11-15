import type { ShopStatus as Status } from '@catalog/contract';

const LABELS: Record<Status, { text: string; dot: string; color: string }> = {
  published: { text: 'Опубликован', dot: 'bg-stock-in', color: 'text-stock-in' },
  draft: { text: 'Черновик', dot: 'bg-[#e8a100]', color: 'text-stock-low' },
  blocked: { text: 'Заблокирован', dot: 'bg-coral-underside', color: 'text-coral-underside' },
};

/** Статус витрины точкой и словом — как в админке. */
export function ShopStatus({ status }: { status: Status }) {
  const { text, dot, color } = LABELS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap ${color}`}>
      <span aria-hidden="true" className={`size-2 flex-none rounded-full ${dot}`} />
      {text}
    </span>
  );
}
