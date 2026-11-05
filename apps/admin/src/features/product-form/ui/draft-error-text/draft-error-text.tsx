/** Ошибка таблицы размеров после попытки сохранить (`rows` формы товара). */
export function DraftErrorText({ error }: { error: unknown }) {
  if (typeof error !== 'string') return null;
  return (
    <p role="alert" className="mt-1.5 text-[13px] text-coral-underside">
      {error}
    </p>
  );
}
