import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';

import { cx } from '../cx.js';
import { useIsDesktop } from '../hooks/useIsDesktop.js';
import { Icon, type IconName } from './Icon.js';
import { Sheet } from './Sheet.js';

/** `depth` — отступ вложенной категории; `group` — подпись над подряд идущими пунктами с одной группой. */
export type SelectOption = { value: string; label: string; depth?: number; group?: string };

/** Действие в конце списка, не значение: «+ Новая категория…», «Настроить категории…». */
export type SelectAction = { key: string; label: ReactNode; icon?: IconName; onSelect: () => void };

export type SelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Что выбирают: заголовок шторки на телефоне и имя списка для экранных дикторов. */
  label: string;
  actions?: SelectAction[];
  /** Вид кнопки — у каждого места свой (пилюля, поле формы). */
  className?: string;
  /** Содержимое кнопки: выбранное значение и стрелка. */
  children: ReactNode;
  /** Для `<label htmlFor>` снаружи; без него кнопка подписана `label` и выбранным значением. */
  id?: string;
  /** К какому краю кнопки прижат список на компьютере. */
  align?: 'start' | 'end';
};

const CLOSE_MS = 160; // как animate-pop-out в tokens.css
const GAP = 6;
const MAX_WIDTH = 360; // как max-w у панели

/**
 * Свой выпадающий список вместо системного select: на компьютере — панель под кнопкой (раскрывается, гаснет при
 * закрытии; стрелки, Enter, Esc), на телефоне — шторка снизу с теми же пунктами. В конце — действия
 * (`actions`), отделённые чертой: они не значения списка.
 */
export function Select({ value, options, onChange, label, actions = [], className, children, id, align }: SelectProps) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const current = options.find((option) => option.value === value);

  const close = (focusTrigger: boolean) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };
  const choose = (next: string) => {
    close(true);
    if (next !== value) onChange(next);
  };
  const act = (action: SelectAction) => {
    close(false);
    action.onSelect();
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open && isDesktop ? listId : undefined}
        aria-label={id ? undefined : `${label}: ${current?.label ?? ''}`}
        onClick={() => setOpen((state) => !state)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={cx('cursor-pointer', className)}
      >
        {children}
      </button>
      {isDesktop ? (
        <Dropdown
          open={open}
          listId={listId}
          label={label}
          anchor={triggerRef}
          align={align ?? 'start'}
          value={value}
          options={options}
          actions={actions}
          onChoose={choose}
          onAction={act}
          onClose={close}
        />
      ) : (
        <Sheet open={open} onClose={() => setOpen(false)} title={label}>
          <SheetOptions value={value} options={options} actions={actions} onChoose={choose} onAction={act} />
        </Sheet>
      )}
    </>
  );
}

type ListProps = {
  value: string;
  options: SelectOption[];
  actions: SelectAction[];
  onChoose: (value: string) => void;
  onAction: (action: SelectAction) => void;
};

/** Подпись группы — перед первым пунктом каждой новой группы. */
const groupStart = (options: SelectOption[], index: number) =>
  options[index]!.group !== undefined && options[index]!.group !== options[index - 1]?.group;

function Dropdown({
  open,
  listId,
  label,
  anchor,
  align,
  value,
  options,
  actions,
  onChoose,
  onAction,
  onClose,
}: ListProps & {
  open: boolean;
  listId: string;
  label: string;
  anchor: RefObject<HTMLButtonElement | null>;
  align: 'start' | 'end';
  onClose: (focusTrigger: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);
  const [active, setActive] = useState(0);
  // место задаётся до первой отрисовки (useLayoutEffect); visibility: hidden тут нельзя — скрытое не получит фокус
  const [style, setStyle] = useState<CSSProperties>({});
  const count = options.length + actions.length;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // открытие — сразу, закрытие — после анимации
  useEffect(() => {
    if (open) {
      setMounted(true);
      setLeaving(false);
      setActive(
        Math.max(
          0,
          options.findIndex((option) => option.value === value),
        ),
      );
      return;
    }
    if (!mounted) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setMounted(false);
      return;
    }
    setLeaving(true);
    const timer = setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, CLOSE_MS);
    return () => clearTimeout(timer);
    // value и options читаем только в момент открытия
  }, [open]);

  // поверх всего (popover — верхний слой, его не обрежет прокручиваемый родитель) и у кнопки: снизу, а если
  // места мало — сверху
  useLayoutEffect(() => {
    const panel = ref.current;
    const button = anchor.current;
    if (!mounted || !panel || !button) return;
    if (!panel.matches(':popover-open')) panel.showPopover?.();
    if (!open) return;
    panel.focus({ preventScroll: true });
    const place = () => {
      const rect = button.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - GAP - 12;
      const above = rect.top - GAP - 12;
      const height = panel.scrollHeight;
      const up = height > below && above > below;
      const width = Math.max(Math.min(rect.width, MAX_WIDTH), panel.offsetWidth);
      const left =
        align === 'end' ? Math.max(12, rect.right - width) : Math.min(rect.left, window.innerWidth - width - 12);
      setStyle({
        left,
        // по ширине кнопки, но широкое поле формы не растягивает список на полэкрана
        minWidth: Math.min(rect.width, MAX_WIDTH),
        maxHeight: Math.max(160, up ? above : below),
        transformOrigin: up ? 'bottom' : 'top',
        ...(up ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [mounted, open, anchor, align]);

  // клик мимо списка и кнопки закрывает
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target) || anchor.current?.contains(target)) return;
      onCloseRef.current(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open, anchor]);

  // выбранный стрелками пункт — в поле зрения
  useEffect(() => {
    if (open) ref.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  if (!mounted) return null;

  const activate = (index: number) => {
    if (index < options.length) onChoose(options[index]!.value);
    else onAction(actions[index - options.length]!);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const move = (index: number) => {
      event.preventDefault();
      setActive((index + count) % count);
    };
    switch (event.key) {
      case 'ArrowDown':
        return move(active + 1);
      case 'ArrowUp':
        return move(active - 1);
      case 'Home':
        return move(0);
      case 'End':
        return move(count - 1);
      case 'Enter':
      case ' ':
        event.preventDefault();
        return activate(active);
      case 'Escape':
        event.preventDefault();
        event.stopPropagation(); // не закрывать шторку или окно, в котором стоит список
        return onClose(true);
      case 'Tab':
        return onClose(false);
    }
  };

  const item = (index: number, content: ReactNode, extra: { selected?: boolean; depth?: number; tone?: 'action' }) => (
    <div
      key={index}
      id={`${listId}-${index}`}
      data-index={index}
      role="option"
      aria-selected={extra.selected ?? false}
      onPointerMove={() => setActive(index)}
      onClick={() => activate(index)}
      style={extra.depth ? { paddingLeft: 12 + extra.depth * 16 } : undefined}
      className={cx(
        'flex min-h-10 cursor-pointer items-center gap-2.5 rounded-[12px] px-3 py-2 text-[14px] leading-[1.3]',
        index === active && 'bg-chip-haze',
        extra.tone === 'action' ? 'font-semibold text-iris' : extra.selected ? 'font-bold' : 'font-medium',
      )}
    >
      {content}
    </div>
  );

  return (
    <div
      ref={ref}
      id={listId}
      popover="manual"
      role="listbox"
      tabIndex={-1}
      aria-label={label}
      aria-activedescendant={`${listId}-${active}`}
      onKeyDown={onKeyDown}
      style={style}
      className={cx(
        'fixed inset-auto m-0 max-w-[360px] overflow-y-auto overscroll-contain rounded-[18px] border-0 bg-white p-1.5 font-sans text-ink-night outline-none',
        'shadow-[0_18px_48px_rgb(23_19_61/0.16),0_0_0_1px_rgb(23_19_61/0.06)]',
        leaving ? 'pointer-events-none motion-safe:animate-pop-out' : 'motion-safe:animate-menu-in',
      )}
    >
      {options.map((option, index) => (
        <div key={option.value} role="presentation">
          {groupStart(options, index) && (
            <div role="presentation" className="px-3 pt-2.5 pb-1 text-[12px] font-semibold text-ink-quiet">
              {option.group}
            </div>
          )}
          {item(
            index,
            <>
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.value === value && (
                <Icon name="check" size={16} strokeWidth={2.6} className="flex-none text-iris" />
              )}
            </>,
            { selected: option.value === value, depth: option.depth },
          )}
        </div>
      ))}
      {actions.length > 0 && <div role="presentation" className="mx-2 my-1.5 h-px bg-[#f0eef7]" />}
      {actions.map((action, index) =>
        item(
          options.length + index,
          <>
            {action.icon && <Icon name={action.icon} size={17} className="flex-none" />}
            <span className="min-w-0 flex-1 truncate">{action.label}</span>
          </>,
          { tone: 'action' },
        ),
      )}
    </div>
  );
}

/** Телефон: пункты шторки — строки с кружком выбора, как в шторке «Порядок и категория». */
function SheetOptions({ value, options, actions, onChoose, onAction }: ListProps) {
  return (
    <>
      <div role="radiogroup">
        {options.map((option, index) => {
          const checked = option.value === value;
          return (
            <div key={option.value}>
              {groupStart(options, index) && (
                <div className="pt-3 pb-1 text-[13px] font-semibold text-ink-quiet">{option.group}</div>
              )}
              <button
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => onChoose(option.value)}
                style={option.depth ? { paddingLeft: 4 + option.depth * 18 } : undefined}
                className="flex min-h-[49px] w-full items-center gap-3 border-b border-[#f0eef7] px-1 py-2 text-left"
              >
                <span className={cx('min-w-0 flex-1 text-[15px]', checked ? 'font-bold' : 'font-medium')}>
                  {option.label}
                </span>
                <span
                  aria-hidden="true"
                  className={cx(
                    'size-[22px] flex-none rounded-full bg-white transition-[border-width] duration-150',
                    checked ? 'border-[7px] border-ink-night' : 'border-2 border-[#c9c3e3]',
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={() => onAction(action)}
          className="flex h-[49px] w-full items-center gap-2 px-1 text-left text-[15px] font-semibold text-iris"
        >
          {action.icon && <Icon name={action.icon} size={18} />}
          {action.label}
        </button>
      ))}
    </>
  );
}
