import { cx, Icon } from '@catalog/ui';

// значки соцсетей в фирменных цветах, чтобы узнавались с первого взгляда (макет «О магазине»: контакты)
const brands = {
  whatsapp: {
    title: 'WhatsApp',
    badge: 'rounded-full bg-[#25d366]',
    surface: 'bg-mint-soft hover:bg-mint-soft-hover',
  },
  instagram: {
    title: 'Instagram',
    badge:
      'rounded-[30%] bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285aeb_90%)]',
    surface: 'bg-[#f6f5fb] hover:bg-chip-haze',
  },
};

/**
 * Контакт магазина: значок, «WhatsApp» / «Instagram» и под ним номер или логин; длинный логин обрезается
 * многоточием, а не выталкивает соседнюю кнопку. `compact` — кнопка в выпадающей панели компьютера (две
 * в ряд, поровну), иначе — строка во всю ширину в шторке телефона со стрелкой «откроется приложение».
 */
export function ContactLink({
  kind,
  href,
  value,
  compact,
}: {
  kind: keyof typeof brands;
  href: string;
  value: string;
  compact?: boolean;
}) {
  const brand = brands[kind];
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cx(
        'press flex min-w-0 items-center',
        compact ? 'h-14 flex-1 basis-0 gap-2.5 rounded-field px-3' : 'h-[60px] gap-3 rounded-field px-3.5',
        brand.surface,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'flex flex-none items-center justify-center text-white',
          compact ? 'size-8' : 'size-9',
          brand.badge,
        )}
      >
        <Icon name={kind} size={compact ? 19 : 21} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={compact ? 'text-[13px] font-bold' : 'text-[15px] font-semibold'}>{brand.title}</span>
        <span className={cx('truncate text-ink-quiet tabular-nums', compact ? 'text-[12px]' : 'text-[13px]')}>
          {value}
        </span>
      </span>
      {!compact && <Icon name="arrow-up-right" size={16} strokeWidth={2.4} className="flex-none text-ink-muted" />}
    </a>
  );
}
