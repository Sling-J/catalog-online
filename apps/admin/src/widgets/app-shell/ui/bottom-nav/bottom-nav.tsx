import { cx, Icon } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { NAV_ITEMS } from '@/widgets/app-shell/constants';
import { useNavLabels } from '@/widgets/app-shell/hooks';

/** Нижнее меню телефона на сиреневом: три раздела, выбранный — на белой плашке. */
export function BottomNav() {
  const { t } = useLingui();
  const labels = useNavLabels();
  return (
    <nav
      aria-label={t`Разделы`}
      className="fixed inset-x-0 bottom-0 z-20 flex gap-1 rounded-t-[26px] bg-lilac-field px-2.5 pt-2 pb-[calc(20px+env(safe-area-inset-bottom))] lg:hidden"
    >
      {NAV_ITEMS.map((item) => (
        <Link key={item.key} to={item.to} className="press flex-1">
          {({ isActive }) => (
            <span
              className={cx(
                'flex h-14 flex-col items-center justify-center gap-[3px] rounded-[18px] text-[12px]',
                isActive ? 'bg-white font-bold shadow-[0_3px_0_rgb(90_70_190/0.25)]' : 'font-semibold',
              )}
            >
              <Icon name={item.icon} size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              {labels[item.key]}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
