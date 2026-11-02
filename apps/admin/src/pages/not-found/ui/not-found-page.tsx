import { Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

/** Адреса нет в админке. */
export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-title">
        <Trans>Такой страницы нет</Trans>
      </h1>
      <Link
        to="/products"
        className="press inline-flex h-[50px] items-center rounded-pill bg-ink-night px-[22px] text-label text-white shadow-press-ink"
      >
        <Trans>К товарам</Trans>
      </Link>
    </main>
  );
}
