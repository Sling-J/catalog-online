import { Plural, Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';

import { CopyLinkButton } from '@/features/copy-link';
import { PublishButton } from '@/features/publish-shop';
import { ResendVerificationLink } from '@/features/resend-verification';
import { meQueryOptions } from '@/entities/session';
import { shopQueryOptions, storefrontHost, storefrontUrl } from '@/entities/shop';

import { buildChecklist, type ChecklistItem } from '@/pages/home/lib';

import { ChecklistStep } from './checklist-step';

/**
 * Главная до публикации (FR-A2; макеты AdminPhone экран 1, AdminAuthPhone экран 10, AdminHome — A16).
 * Телефон: заголовок, полоска готовности, чек-лист, адрес витрины; «Опубликовать» закреплена над меню.
 * Компьютер: чек-лист слева, адрес и «Опубликовать» справа.
 */
export function HomePage() {
  const { data: shop } = useSuspenseQuery(shopQueryOptions());
  const { data: me } = useSuspenseQuery(meQueryOptions());
  const { readiness } = shop;
  const checklist = buildChecklist(readiness, me.account.emailVerified);
  const url = shop.subdomain ? storefrontUrl(shop.subdomain, window.location.origin) : null;

  const step = (item: ChecklistItem) => {
    switch (item.key) {
      case 'settings':
        return item.done ? (
          <ChecklistStep
            key={item.key}
            done
            title={<Trans>Магазин настроен</Trans>}
            sub={<Trans>Название, WhatsApp, адрес, график</Trans>}
          />
        ) : (
          <ChecklistStep
            key={item.key}
            title={<Trans>Настройте магазин</Trans>}
            sub={<Trans>Адрес, график, как найти</Trans>}
            action={{ to: '/shop', label: <Trans>Заполнить →</Trans> }}
          />
        );
      case 'products':
        return item.done ? (
          <ChecklistStep
            key={item.key}
            done
            title={<Trans>Товары загружены</Trans>}
            sub={<Plural value={readiness.productCount} one="# товар" few="# товара" other="# товаров" />}
          />
        ) : (
          <ChecklistStep
            key={item.key}
            title={<Trans>Загрузите товары</Trans>}
            sub={<Trans>Из Excel или вручную</Trans>}
            action={{ to: '/products', label: <Trans>Добавить →</Trans> }}
          />
        );
      case 'photos':
        if (item.muted) {
          return (
            <ChecklistStep
              key={item.key}
              muted
              title={<Trans>Добавьте фото</Trans>}
              sub={<Trans>Когда появятся товары</Trans>}
            />
          );
        }
        return item.done ? (
          <ChecklistStep
            key={item.key}
            done
            title={<Trans>У товаров есть фото</Trans>}
            sub={<Trans>Покупатели видят каждый товар</Trans>}
          />
        ) : (
          <ChecklistStep
            key={item.key}
            title={<Trans>Добавьте фото</Trans>}
            sub={
              <Plural
                value={readiness.productsWithoutPhoto}
                one="# товар без фото — его не видно"
                few="# товара без фото — их не видно"
                other="# товаров без фото — их не видно"
              />
            }
            // быстрый режим «Добавить фото» — T-308; пока ведём в «Товары» (A16)
            action={{ to: '/products', label: <Trans>Снять →</Trans> }}
          />
        );
      case 'email':
        return (
          <ChecklistStep
            key={item.key}
            title={<Trans>Подтвердите почту</Trans>}
            sub={<Trans>Письмо на {me.account.email}</Trans>}
            extra={
              <ResendVerificationLink className="text-[14px]">
                <Trans>Ещё раз</Trans>
              </ResendVerificationLink>
            }
          />
        );
      case 'publish':
        return (
          <ChecklistStep
            key={item.key}
            title={<Trans>Опубликуйте витрину</Trans>}
            sub={<Trans>После этого ссылкой можно делиться</Trans>}
          />
        );
    }
  };

  const address = url && (
    <div className="rounded-[20px] bg-lilac-mist p-3.5">
      <div className="text-[13px] font-semibold text-ink-quiet">
        <Trans>Адрес витрины</Trans>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2.5">
        <span className="min-w-0 truncate text-[16px] font-bold">{storefrontHost(url)}</span>
        <CopyLinkButton url={url} bare />
      </div>
    </div>
  );
  const publish = <PublishButton blocker={checklist.blocker} withoutPhotos={readiness.productsWithoutPhoto > 0} />;

  return (
    <div className="pt-1 lg:pt-0">
      <h1 className="text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] lg:text-[30px] lg:leading-[normal]">
        <Trans>Осталось немного до запуска</Trans>
      </h1>
      <div className="lg:mt-1.5 lg:flex lg:items-start lg:gap-8">
        <div className="lg:w-[560px] lg:flex-none">
          <div className="mt-1.5 text-[15px] text-ink-soft lg:mt-0">
            <Trans>
              {checklist.done} из {checklist.total} шагов готово
            </Trans>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-pill bg-chip-haze">
            <div
              className="h-full rounded-pill bg-mint"
              style={{ width: `${(checklist.done / checklist.total) * 100}%` }}
            />
          </div>
          <div className="mt-[18px] flex flex-col gap-2 lg:mt-[22px]">{checklist.items.map(step)}</div>
        </div>
        <div className="mt-4 lg:mt-[50px] lg:w-[360px] lg:flex-none">
          {address}
          <div className="mt-4 hidden lg:block">{publish}</div>
        </div>
      </div>
      {/* телефон: над нижним меню, как в макете */}
      <div className="fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] px-4 lg:hidden">{publish}</div>
    </div>
  );
}
