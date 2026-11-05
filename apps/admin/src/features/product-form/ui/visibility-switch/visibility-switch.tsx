import { cx, Switch } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

/**
 * «Показывать на витрине» с пояснением: на телефоне строкой (макет AdminPhone, экран 3), на компьютере — белой
 * карточкой с рамкой (макет AdminDesk, экран 2).
 */
export function VisibilitySwitch({
  checked,
  card,
  onChange,
}: {
  checked: boolean;
  card?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      className={cx(
        'text-left font-normal',
        card ? 'rounded-field border-[1.5px] border-[#e2dff0] bg-white px-4 py-3' : 'px-0.5 py-1',
      )}
      label={
        // высота строк как у Geologica в макете (у переключателя своя — для подписи в одну строку)
        <span className="block leading-[1.25]">
          <span className="block text-[15px] font-semibold">
            <Trans>Показывать на витрине</Trans>
          </span>
          <span className="block text-[12px] text-ink-muted">
            <Trans>Скрытый товар виден только вам</Trans>
          </span>
        </span>
      }
    />
  );
}
