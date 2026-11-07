import type { Attribute } from '@catalog/contract';
import { cx, Icon } from '@catalog/ui';
import { move } from '@dnd-kit/helpers';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

import { problemCode } from '@/shared/api';

type Value = Attribute['values'][number];

const VALUE_MAX = 60;
const chip =
  'box-border inline-flex h-[34px] min-w-[44px] items-center justify-center rounded-[10px] px-2.5 text-[14px] font-semibold';

/**
 * Значения свойства чипами (макет AdminPhone2, «Категории и размеры»): порядок перетаскиванием — как на витрине,
 * нажатие — шторка значения. В конце «+» (в макете нет): поле прямо в ряду, Enter добавляет и оставляет поле для
 * следующего, Esc или пустое поле при уходе — закрывает.
 */
export function ValueChips({
  attribute,
  onReorder,
  onOpen,
  onAdd,
}: {
  attribute: Attribute;
  onReorder: (ids: string[]) => void;
  onOpen: (value: Value) => void;
  onAdd: (value: string) => Promise<unknown>;
}) {
  const { t } = useLingui();
  const [order, setOrder] = useState<string[] | null>(null);
  const current = useRef<string[] | null>(null);
  const ids = attribute.values.map((entry) => entry.id);
  const byId = new Map(attribute.values.map((entry) => [entry.id, entry]));
  const shown = (order ?? ids).flatMap((id) => byId.get(id) ?? []);

  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      <DragDropProvider
        onDragStart={() => {
          current.current = ids;
          setOrder(ids);
        }}
        onDragOver={(event) => {
          if (!current.current) return;
          current.current = move(current.current, event);
          setOrder(current.current);
        }}
        onDragEnd={(event) => {
          const final = current.current;
          current.current = null;
          setOrder(null);
          if (event.canceled || !final || final.join() === ids.join()) return;
          onReorder(final);
        }}
      >
        {shown.map((entry, index) => (
          <ValueChip key={entry.id} value={entry} index={index} onOpen={onOpen} />
        ))}
      </DragDropProvider>
      <AddValue
        name={attribute.name}
        existing={attribute.values.map((entry) => entry.value)}
        onAdd={onAdd}
        label={t`Добавить значение`}
      />
    </div>
  );
}

function ValueChip({ value, index, onOpen }: { value: Value; index: number; onOpen: (value: Value) => void }) {
  const { ref, isDragSource } = useSortable({ id: value.id, index });
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onOpen(value)}
      className={cx(
        chip,
        'touch-manipulation bg-chip-haze hover:bg-haze-hover',
        isDragSource && 'shadow-[0_6px_16px_rgb(40_30_110/0.18)]',
      )}
    >
      {value.value}
    </button>
  );
}

function AddValue({
  name,
  existing,
  label,
  onAdd,
}: {
  name: string;
  existing: string[];
  label: string;
  onAdd: (value: string) => Promise<unknown>;
}) {
  const { t } = useLingui();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const close = () => {
    setEditing(false);
    setText('');
    setError(null);
  };
  const submit = async () => {
    const value = text.trim();
    if (!value || pending) return;
    if (existing.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setError(t`Такое значение уже есть`);
      return;
    }
    setPending(true);
    try {
      await onAdd(value);
      setText('');
      setError(null);
    } catch (failure) {
      setError(
        problemCode(failure) === 'attribute_value_taken'
          ? t`Такое значение уже есть`
          : t`Не получилось добавить. Проверьте интернет и попробуйте ещё раз.`,
      );
    } finally {
      setPending(false);
    }
  };

  if (!editing)
    return (
      <button
        type="button"
        aria-label={label}
        onClick={() => setEditing(true)}
        className={cx(chip, 'border-[1.5px] border-dashed border-[#c9c3e3] text-ink-quiet hover:bg-[#f8f7fd]')}
      >
        <Icon name="plus" size={16} strokeWidth={2.4} />
      </button>
    );
  return (
    <span className="flex w-full flex-col gap-1">
      <input
        autoFocus
        value={text}
        maxLength={VALUE_MAX}
        aria-label={t`Новое значение «${name}»`}
        aria-invalid={error ? true : undefined}
        placeholder={t`Новое значение`}
        enterKeyHint="done"
        onChange={(event) => {
          setText(event.target.value);
          setError(null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            void submit();
          }
          if (event.key === 'Escape') {
            event.stopPropagation();
            close();
          }
        }}
        onBlur={() => {
          if (!text.trim()) close();
        }}
        className={cx(
          chip,
          'w-[160px] justify-start border-[1.5px] bg-white font-normal outline-none focus:border-ink-night',
          error ? 'border-coral-underside' : 'border-[#e2dff0]',
        )}
      />
      {error && (
        <span role="alert" className="text-[13px] text-coral-underside">
          {error}
        </span>
      )}
    </span>
  );
}
