import { Trans } from '@lingui/react/macro';

import { AttributesSection } from '@/features/manage-attributes';
import { CategoriesSection } from '@/features/manage-categories';
import { BackBar } from '@/shared/ui';

/**
 * «Магазин → Категории и свойства» (FR-A6; макет AdminPhone2, экран 8): категории с порядком и вложенностью до
 * 2 уровней, свойства со значениями и «в фильтрах». Телефон — вложенный экран с «Назад». На компьютере макета
 * нет — заголовок (путь не нужен: слева подменю «Магазина») и колонка 560 px, как «Вход и пароль».
 */
export function ShopCategoriesPage() {
  return (
    <>
      <BackBar to="/shop">
        <Trans>Категории и свойства</Trans>
      </BackBar>
      <div className="hidden lg:block">
        <h1 className="text-[30px] font-extrabold tracking-[-0.03em]">
          <Trans>Категории и свойства</Trans>
        </h1>
      </div>
      <div className="lg:w-[560px]">
        <CategoriesSection />
        <AttributesSection />
      </div>
    </>
  );
}
