import { cx, Icon } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';

import { useDebouncedValue } from '@/shared/hooks';

const DEBOUNCE_MS = 300;

/**
 * Поиск товаров по названию, артикулу и штрихкоду (макеты AdminPhone, экран 2, и AdminDesk, экран 1).
 * Запрос уходит, когда ввод затих; поле на всю ширину на телефоне и 360 px на компьютере.
 */
export function ProductSearch({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (q: string) => void;
  className?: string;
}) {
  const { t } = useLingui();
  const [text, setText] = useState(value);
  const debounced = useDebouncedValue(text, DEBOUNCE_MS);

  // адрес поменялся снаружи («Назад», сброс) — показываем его
  useEffect(() => setText(value), [value]);
  // onChange и value меняются на каждом рендере страницы; запрос уходит только по затихшему вводу
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  useEffect(() => {
    if (debounced.trim() !== latest.current.value) latest.current.onChange(debounced.trim());
  }, [debounced]);

  return (
    <label
      className={cx(
        'flex h-[46px] items-center gap-2 rounded-field bg-chip-haze px-3.5 text-[15px] text-ink-muted',
        'focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-iris',
        'lg:h-11 lg:w-[360px] lg:flex-none lg:rounded-[14px] lg:text-[14px]',
        className,
      )}
    >
      <Icon name="search" size={18} className="flex-none lg:size-[17px]" />
      <input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={t`Название, артикул, штрихкод`}
        aria-label={t`Поиск товаров`}
        className="min-w-0 flex-1 bg-transparent text-ink-night outline-none placeholder:text-ink-muted"
      />
      {/* очистить — доска AdminProductsStates, экраны 3 и 10 */}
      {text && (
        <button
          type="button"
          onClick={() => {
            setText('');
            onChange('');
          }}
          aria-label={t`Очистить поиск`}
          className="flex size-6 flex-none items-center justify-center rounded-full bg-[#dcd8ee] text-ink-night"
        >
          <Icon name="close" size={14} strokeWidth={2.4} />
        </button>
      )}
    </label>
  );
}
