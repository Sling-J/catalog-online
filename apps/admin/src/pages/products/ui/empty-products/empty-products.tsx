import { Icon, type IconName } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { Link, type LinkProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';

function Choice({
  to,
  icon,
  tone,
  title,
  sub,
}: {
  to: LinkProps['to'];
  icon: IconName;
  tone: string;
  title: ReactNode;
  sub: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="press flex items-center gap-3.5 rounded-[22px] bg-white p-4 lg:flex-1 lg:p-[18px] shadow-[0_1px_0_#eceaf5,0_6px_16px_rgb(40_30_110/0.05)]"
    >
      <span className={`flex size-12 flex-none items-center justify-center rounded-2xl ${tone}`}>
        <Icon name={icon} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-bold">{title}</span>
        <span className="block text-[13px] text-ink-quiet">{sub}</span>
      </span>
      <Icon name="chevron-right" size={18} className="flex-none text-ink-quiet" />
    </Link>
  );
}

/**
 * «Товаров пока нет» (макет AdminPhone2, экран 6; компьютер — доска AdminProductsStates, экран 7): глиняная фигурка
 * с нулём, выбор — загрузить Excel или завести вручную (на компьютере две карточки в ряд).
 */
export function EmptyProducts() {
  return (
    <>
      {/* на компьютере — внешний отступ, как в макете: отступ точки внутри фигурки с ним схлопывается */}
      <div className="px-2 pt-[50px] text-center lg:mx-auto lg:mt-20 lg:w-[640px] lg:px-0 lg:pt-0">
        <div
          aria-hidden="true"
          className="mx-auto h-[120px] w-24 rotate-[8deg] rounded-[22px] bg-[radial-gradient(120%_90%_at_30%_15%,#fff0a8,#ffd23f_55%,#e3ae00)] shadow-[inset_-10px_-14px_20px_rgb(80_40_0/0.28),inset_8px_9px_16px_rgb(255_255_255/0.55),0_24px_36px_rgb(60_30_120/0.22)]"
        >
          <div className="mx-auto mt-3.5 size-[18px] rounded-full bg-paper" />
          <div className="mt-3 text-[30px] font-extrabold text-[#6b4e00]">0</div>
        </div>
        <h2 className="mt-[26px] text-[22px] font-extrabold lg:mt-[30px] lg:text-[26px]">
          <Trans>Добавьте первые товары</Trans>
        </h2>
        <p className="mt-2 text-[15px] leading-normal text-ink-soft lg:mt-2.5 lg:text-[16px]">
          <Trans>
            Если товары уже есть в Excel или выгрузке из учётной программы — загрузите файл. Если нет — заведите
            вручную.
          </Trans>
        </p>
      </div>
      <div className="flex flex-col gap-2.5 pt-[26px] lg:mx-auto lg:w-[720px] lg:flex-row lg:gap-3 lg:pt-8">
        <Choice
          to="/import"
          icon="upload"
          tone="bg-sun"
          title={<Trans>Загрузить Excel</Trans>}
          sub={<Trans>Сотни товаров за пару минут</Trans>}
        />
        <Choice
          to="/products/new"
          icon="plus"
          tone="bg-lilac-mist"
          title={<Trans>Добавить вручную</Trans>}
          sub={<Trans>Фото, название, размеры, количество</Trans>}
        />
      </div>
    </>
  );
}
