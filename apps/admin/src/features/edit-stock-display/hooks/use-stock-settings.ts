import { type Shop, type ShopUpdate, updateShop } from '@catalog/contract';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { applyShop, shopQueryOptions } from '@/entities/shop';

export type StockSettings = Pick<ShopUpdate, 'stockDisplay' | 'lowStockThreshold' | 'showOutOfStock'>;

export const THRESHOLD_MIN = 1;
export const THRESHOLD_MAX = 50;
// порог меняют кнопками «− / +»: сохраняем, когда нажимать перестали
const THRESHOLD_SAVE_MS = 600;

/**
 * Настройки «Наличие на витрине» (FR-A8, D5): режим, порог «мало», показ закончившихся. Кнопки «Сохранить» нет
 * (макет AdminPhone2): каждая правка уходит сразу (`PATCH /shop`) и видна до ответа сервера; не сохранилась —
 * возвращается прежнее и `failed`. Порог сохраняется, когда «− / +» перестали нажимать, или при уходе с экрана.
 */
export function useStockSettings(shop: Shop) {
  const queryClient = useQueryClient();
  const [failed, setFailed] = useState(false);
  const [threshold, setThresholdState] = useState(shop.lowStockThreshold);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<(() => void) | null>(null);

  const save = useMutation({
    mutationFn: async (body: StockSettings) => (await updateShop({ body, throwOnError: true })).data,
    onSuccess: (saved) => applyShop(queryClient, saved),
  });

  const change = (patch: StockSettings) => {
    const key = shopQueryOptions().queryKey;
    const before = queryClient.getQueryData<Shop>(key);
    setFailed(false);
    if (before) queryClient.setQueryData<Shop>(key, { ...before, ...patch });
    save.mutate(patch, {
      onError: () => {
        if (!before) return;
        queryClient.setQueryData(key, before);
        if (patch.lowStockThreshold !== undefined) setThresholdState(before.lowStockThreshold);
        setFailed(true);
      },
    });
  };

  const setThreshold = (value: number) => {
    const next = Math.min(THRESHOLD_MAX, Math.max(THRESHOLD_MIN, value));
    setThresholdState(next);
    if (timer.current) clearTimeout(timer.current);
    pending.current = next === shop.lowStockThreshold ? null : () => change({ lowStockThreshold: next });
    timer.current = setTimeout(() => {
      pending.current?.();
      pending.current = null;
    }, THRESHOLD_SAVE_MS);
  };

  // ушли с экрана раньше паузы — порог всё равно сохраняем
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      pending.current?.();
    },
    [],
  );

  return {
    threshold,
    setThreshold,
    setMode: (stockDisplay: Shop['stockDisplay']) => {
      if (stockDisplay !== shop.stockDisplay) change({ stockDisplay });
    },
    setShowOutOfStock: (showOutOfStock: boolean) => change({ showOutOfStock }),
    failed,
  };
}
