import { Button } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

/** Не удалось загрузить данные: нет связи или ошибка сервера. Макета служебных состояний админки пока нет. */
export function ErrorPage({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-title">
        <Trans>Не получилось загрузить</Trans>
      </h1>
      <p className="max-w-[360px] text-body text-ink-quiet">
        <Trans>Проверьте интернет и попробуйте ещё раз.</Trans>
      </p>
      <Button variant="dark" size="state" onClick={onRetry}>
        <Trans>Повторить</Trans>
      </Button>
    </main>
  );
}
