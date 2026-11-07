import type { Stats } from '@catalog/contract';
import { formatAmount, Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

const SHOWN = 3;

/**
 * «Чаще смотрят» (макет AdminPhone2, «Статистика»): фото 40 px, название, полоска относительно первого и число
 * просмотров; три первых, как в макете (API отдаёт до 10). Строка ведёт в карточку товара (в макете не показано).
 * Пусто — пояснение.
 */
export function TopProducts({ items: all }: { items: Stats['topProducts'] }) {
  const items = all.slice(0, SHOWN);
  const max = items[0]?.views ?? 0;
  return (
    <div className="mx-4 mt-2.5 rounded-[20px] bg-white px-3.5 py-2 shadow-[0_1px_0_#eceaf5] lg:mx-0">
      <h2 className="py-1.5 text-[15px] font-bold">
        <Trans>Чаще смотрят</Trans>
      </h2>
      {items.length === 0 ? (
        <p className="pt-0.5 pb-2 text-[14px] leading-[1.45] text-ink-quiet">
          <Trans>Появится, когда покупатели начнут открывать товары.</Trans>
        </p>
      ) : (
        <ol>
          {items.map((item) => (
            <li key={item.productId}>
              <Link
                to="/products/$productId"
                params={{ productId: item.productId }}
                className="-mx-1.5 flex items-center gap-2.5 rounded-xl px-1.5 py-2 hover:bg-[#f8f7fd]"
              >
                {item.cover ? (
                  <img
                    src={item.cover.sizes['320']}
                    alt=""
                    className="size-10 flex-none rounded-[10px] bg-chip-haze object-cover"
                  />
                ) : (
                  <span className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-[#f6f5fb] text-[#8c86b0]">
                    <Icon name="camera" size={16} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{item.name}</span>
                  <span aria-hidden="true" className="mt-[5px] block h-1.5 rounded-pill bg-chip-haze">
                    <span
                      className="block h-full rounded-pill bg-iris"
                      style={{ width: `${max > 0 ? Math.round((item.views / max) * 100) : 0}%` }}
                    />
                  </span>
                </span>
                <span className="text-[14px] font-bold tabular-nums">{formatAmount(item.views)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
