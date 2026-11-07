import { Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { BackBar } from '@/shared/ui';

type Section = 'categories' | 'stock' | 'stats';

/**
 * Заглушка пунктов раздела «Магазин», экраны которых ещё не сделаны: категории (T-311), наличие (T-312),
 * статистика (T-313). Вложенный экран: «Назад» в «Магазин».
 */
export function ShopSoonPage({ section }: { section: Section }) {
  const titles: Record<Section, ReactNode> = {
    categories: <Trans>Категории и размеры</Trans>,
    stock: <Trans>Как показывать наличие</Trans>,
    stats: <Trans>Статистика</Trans>,
  };
  const title = titles[section];
  return (
    <>
      <BackBar to="/shop">{title}</BackBar>
      <div className="hidden lg:block">
        <div className="text-[14px] text-ink-quiet">
          <Link to="/shop" className="hover:text-ink-night">
            <Trans>Магазин</Trans>
          </Link>{' '}
          / {title}
        </div>
        <h1 className="mt-1.5 text-[30px] font-extrabold tracking-[-0.03em]">{title}</h1>
      </div>
      <p className="px-4 pt-4 text-[15px] text-ink-quiet lg:px-0">
        <Trans>Этот экран скоро появится.</Trans>
      </p>
    </>
  );
}
