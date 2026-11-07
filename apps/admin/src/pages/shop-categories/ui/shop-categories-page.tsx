import { Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { AttributesSection } from '@/features/manage-attributes';
import { CategoriesSection } from '@/features/manage-categories';
import { BackBar } from '@/shared/ui';

/**
 * «Магазин → Категории и размеры» (FR-A6; макет AdminPhone2, экран 8): категории с порядком и вложенностью до
 * 2 уровней, свойства со значениями и «в фильтрах». Телефон — вложенный экран с «Назад». На компьютере макета
 * нет — путь, заголовок и колонка 560 px, как «Вход и пароль».
 */
export function ShopCategoriesPage() {
  return (
    <>
      <BackBar to="/shop">
        <Trans>Категории и размеры</Trans>
      </BackBar>
      <div className="hidden lg:block">
        <div className="text-[14px] text-ink-quiet">
          <Link to="/shop" className="hover:text-ink-night">
            <Trans>Магазин</Trans>
          </Link>{' '}
          / <Trans>Категории и размеры</Trans>
        </div>
        <h1 className="mt-1.5 text-[30px] font-extrabold tracking-[-0.03em]">
          <Trans>Категории и размеры</Trans>
        </h1>
      </div>
      <div className="lg:w-[560px]">
        <CategoriesSection />
        <AttributesSection />
      </div>
    </>
  );
}
