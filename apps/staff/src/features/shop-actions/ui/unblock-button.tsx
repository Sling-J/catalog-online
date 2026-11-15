import { staffUnblockShop } from '@catalog/contract';
import { Button } from '@catalog/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { invalidateShops } from '@/entities/shop';

/** «Разблокировать»: API возвращает статус, который был до блокировки, — без подтверждения, действие обратимо. */
export function UnblockButton({ shopId, name }: { shopId: string; name: string }) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const unblock = async () => {
    setPending(true);
    setFailed(false);
    try {
      await staffUnblockShop({ path: { shopId }, throwOnError: true });
      await invalidateShops(queryClient);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <Button variant="line" size="small" onClick={unblock} disabled={pending} aria-label={`Разблокировать: ${name}`}>
        Разблокировать
      </Button>
      {failed && (
        <span role="alert" className="text-[13px] text-coral-underside">
          Не получилось
        </span>
      )}
    </>
  );
}
