import type { Shop } from '@catalog/contract';
import { Icon } from '@catalog/ui';
import { Plural, Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { CopyLinkButton } from '@/features/copy-link';
import { PublishButton } from '@/features/publish-shop';
import { ResendVerificationLink } from '@/features/resend-verification';
import { meQueryOptions } from '@/entities/session';
import { publishBlockers, shopQueryOptions, storefrontHost, storefrontUrl, StorefrontLink } from '@/entities/shop';

import { buildChecklist, type ChecklistItem } from '@/pages/home/lib';

import { ChecklistStep } from '../checklist-step';

/**
 * Главная до публикации (FR-A2; макеты AdminPhone экран 1, AdminAuthPhone экран 10, AdminHome — A16; правки
 * UX-аудита L1, L2, U5). Телефон: заголовок, полоска готовности, чек-лист, адрес витрины; «Опубликовать» закреплена
 * над меню (липкая, в потоке страницы). Компьютер: чек-лист слева, адрес и «Опубликовать» справа. Статистика — строкой
 * в карточке адреса: она есть и в черновике, но до публикации пуста.
 */
export function LaunchHome({ onPublished }: { onPublished: (shop: Shop) => void }) {
  const { data: shop } = useSuspenseQuery(shopQueryOptions());
  const { data: me } = useSuspenseQuery(meQueryOptions());
  const { readiness } = shop;
  const checklist = buildChecklist(readiness, me.account.emailVerified);
  const url = shop.subdomain ? storefrontUrl(shop.subdomain, window.location.origin) : null;

  const step = (item: ChecklistItem) => {
    switch (item.key) {
      case 'created':
        return (
          <ChecklistStep
            key={item.key}
            done
            title={<Trans>Магазин создан</Trans>}
            sub={<Trans>Название, адрес витрины, WhatsApp</Trans>}
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
            action={{ to: '/products/photos', label: <Trans>Снять →</Trans> }}
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
      <StorefrontLink className="mt-2 inline-flex items-center gap-1.5 text-[14px] font-bold text-iris hover:underline">
        <Icon name="eye" size={16} />
        <Trans>Посмотреть, как увидят покупатели</Trans>
      </StorefrontLink>
      <Link
        to="/stats"
        className="group mt-3 flex items-center gap-2 border-t border-[#d3c8ff] pt-3 text-[14px] text-ink-quiet"
      >
        <Icon name="chart" size={16} strokeWidth={2.4} className="flex-none" />
        <span className="min-w-0 flex-1">
          <Trans>
            <b className="font-bold text-ink-night group-hover:underline">Статистика</b> — после публикации
          </Trans>
        </span>
        <Icon name="chevron-right" size={16} strokeWidth={2.4} className="flex-none" />
      </Link>
    </div>
  );
  const publish = (
    <PublishButton
      blockers={publishBlockers(readiness, me.account.emailVerified)}
      withoutPhotos={readiness.productsWithoutPhoto > 0}
      onPublished={onPublished}
    />
  );

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
          <div className="mt-[18px] flex flex-col gap-2 lg:mt-[22px]">
            {checklist.items.map(step)}
            <ChecklistStep
              done={checklist.about.done}
              optional={<Trans>необязательно</Trans>}
              title={<Trans>Расскажите о магазине</Trans>}
              sub={<Trans>Адрес, график, как найти</Trans>}
              action={{
                to: '/shop/info',
                label: checklist.about.done ? <Trans>Изменить</Trans> : <Trans>Заполнить →</Trans>,
              }}
            />
          </div>
        </div>
        <div className="mt-4 lg:mt-[50px] lg:w-[360px] lg:flex-none">
          {address}
          <div className="mt-4 hidden lg:block">{publish}</div>
        </div>
      </div>
      {/* телефон: прилипает над нижним меню, как в макете, но стоит в потоке — конец списка не закрывает,
          сколько бы строк ни было в причинах под кнопкой */}
      <div className="sticky bottom-[calc(96px+env(safe-area-inset-bottom))] z-10 -mx-4 mt-2 bg-[linear-gradient(rgb(251_250_255/0),var(--color-paper)_28px)] px-4 pt-5 lg:hidden">
        {publish}
      </div>
    </div>
  );
}
