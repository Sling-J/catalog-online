import { cx } from '@catalog/ui';

import { normalizeTime } from '@/entities/shop';

/**
 * Время открытия или закрытия: поле по центру, строка дня 54 px, цифры моноширинные (макет AdminDesk2, экран 7). Набирают как
 * удобно — «9», «930», «9.30», — при уходе с поля время приводится к «09:30». Своё поле вместо `type="time"`:
 * у того в каждом браузере свои часики и стрелки, которых нет в макете.
 */
export function TimeInput({
  value,
  label,
  invalid,
  onChange,
}: {
  value: string;
  label: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={5}
      aria-label={label}
      aria-invalid={invalid || undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={(event) => {
        const time = normalizeTime(event.target.value);
        if (time !== event.target.value) onChange(time);
      }}
      className={cx(
        'h-[42px] w-full min-w-0 rounded-xl border-[1.5px] bg-white text-center text-[15px] text-ink-night tabular-nums',
        'focus:border-ink-night focus:ring-[0.5px] focus:ring-ink-night focus:ring-inset focus:outline-none',
        invalid ? 'border-coral-underside' : 'border-[#e2dff0]',
      )}
    />
  );
}
