import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';

import { Icon } from '@/shared/ui';

const DEBOUNCE_MS = 350;

/**
 * Поле поиска по названию. Запрос уходит в адрес после паузы в наборе или по Enter;
 * если адрес поменяли снаружи (сброс), текст в поле обновляется.
 */
export function ProductSearch({ value, onChange }: { value: string; onChange: (query: string) => void }) {
  const { t } = useLingui();
  const [text, setText] = useState(value);
  // последнее значение, которое мы сами отправили: по нему отличаем свой эхо-ответ от внешнего сброса
  const committed = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setText(value);
    }
  }, [value]);

  const commit = (query: string) => {
    const trimmed = query.trim();
    if (trimmed === committed.current) return;
    committed.current = trimmed;
    onChangeRef.current(trimmed);
  };

  useEffect(() => {
    const id = setTimeout(() => commit(text), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [text]);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        commit(text);
      }}
      className="flex h-[46px] min-w-0 flex-1 items-center gap-2 rounded-field bg-chip-haze px-3.5 text-ink-muted"
    >
      <Icon name="search" size={18} className="flex-none" />
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={100}
        enterKeyHint="search"
        placeholder={t`Поиск по магазину`}
        aria-label={t`Поиск по магазину`}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-ink-night outline-none placeholder:text-ink-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          aria-label={t`Очистить поиск`}
          onClick={() => {
            setText('');
            commit('');
          }}
          className="flex size-6 flex-none items-center justify-center rounded-full text-ink-quiet"
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </form>
  );
}
