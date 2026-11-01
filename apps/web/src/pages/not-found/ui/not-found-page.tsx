import { Trans } from '@lingui/react/macro';

// Заглушка: оформление по макету «Пустые и служебные состояния» — позже.
export function NotFoundPage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">
        <Trans>Магазин не найден</Trans>
      </h1>
    </main>
  );
}
