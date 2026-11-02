import type { ReactNode } from 'react';

export type IconName =
  | 'chevron-right'
  | 'chevron-left'
  | 'pin'
  | 'whatsapp'
  | 'instagram'
  | 'arrow-up-right'
  | 'trash'
  | 'copy'
  | 'check'
  | 'search'
  | 'sliders'
  | 'close'
  | 'share'
  | 'bag'
  | 'chevron-down';

// Контурные иконки 24×24, штрих берут от `currentColor`.
const glyphs: Record<IconName, ReactNode> = {
  'chevron-right': <path d="M9 6l6 6-6 6" />,
  'chevron-down': <path d="M7 10l5 5 5-5" />,
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="M6.5 7l1 12.5h9l1-12.5" />
    </>
  ),
  'arrow-up-right': (
    <>
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1.2 11H6.2z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" />
      <path d="M9.5 9.5c.3 1.8 1.7 3.6 4 4.6l1.2-1.2 1.8.8-.4 1.6c-3.4.2-7.4-3.4-7.6-7l1.6-.4.8 1.8z" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  'chevron-left': <path d="M15 6l-6 6 6 6" />,
  share: <path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6" />,
};

export function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  className,
}: {
  name: IconName;
  size?: number;
  /** Стрелки и крестики в макетах толще — 2.4. */
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {glyphs[name]}
    </svg>
  );
}
