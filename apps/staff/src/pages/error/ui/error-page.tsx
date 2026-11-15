import { Button } from '@catalog/ui';

/** Ошибка загрузки или не найденный адрес. */
export function ErrorPage({ title, onRetry }: { title: string; onRetry?: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="text-[22px] font-extrabold">{title}</h1>
      {onRetry ? (
        <Button size="state" onClick={onRetry}>
          Попробовать ещё раз
        </Button>
      ) : (
        <a href="/" className="font-bold text-iris">
          К списку магазинов
        </a>
      )}
    </main>
  );
}
