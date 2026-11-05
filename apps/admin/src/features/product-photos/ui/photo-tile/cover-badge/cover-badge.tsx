import { Trans } from '@lingui/react/macro';

/** Плашка «Обложка» в углу первого фото. */
export function CoverBadge() {
  return (
    <span className="absolute top-3 left-3 inline-flex h-[26px] items-center rounded-pill bg-white/92 px-2.5 text-[12px] font-bold whitespace-nowrap">
      <Trans>Обложка</Trans>
    </span>
  );
}
