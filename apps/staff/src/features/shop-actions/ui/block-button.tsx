import { staffBlockShop } from '@catalog/contract';
import { Button, Sheet } from '@catalog/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useId, useState, type FormEvent } from 'react';

import { invalidateShops } from '@/entities/shop';

const MAX_REASON = 500;

/**
 * «Заблокировать» (FR-S2, D15): окно с необязательной причиной — она пишется в журнал. Витрина магазина сразу
 * отвечает «магазин заблокирован», владелец входит в админку и видит статус.
 */
export function BlockButton({ shopId, name }: { shopId: string; name: string }) {
  const queryClient = useQueryClient();
  const reasonId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setFailed(false);
    try {
      const trimmed = reason.trim();
      await staffBlockShop({ path: { shopId }, body: trimmed ? { reason: trimmed } : {}, throwOnError: true });
      setOpen(false);
      setReason('');
      await invalidateShops(queryClient);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Button variant="line" size="small" onClick={() => setOpen(true)} aria-label={`Заблокировать: ${name}`}>
        Заблокировать
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} placement="center" title={`Заблокировать «${name}»?`}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-[15px] leading-normal text-ink-soft">
            Витрина перестанет открываться покупателям. Владелец сможет войти в админку и увидит, что магазин
            заблокирован. Разблокировка вернёт прежний статус.
          </p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={reasonId} className="text-[13px] font-semibold text-ink-quiet">
              Причина — для журнала, необязательно
            </label>
            <textarea
              id={reasonId}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={MAX_REASON}
              rows={3}
              className="rounded-field border-[1.5px] border-[#e2dff0] bg-white px-3.5 py-[13px] text-[15px] leading-[1.4] focus:border-ink-night focus:outline-none"
            />
          </div>
          {failed && (
            <p role="alert" className="text-[13px] text-coral-underside">
              Не получилось. Попробуйте ещё раз
            </p>
          )}
          <div className="flex flex-col gap-2 lg:flex-row-reverse">
            <Button type="submit" size="form" disabled={pending} className="lg:flex-1">
              Заблокировать
            </Button>
            <Button variant="soft" size="form" onClick={() => setOpen(false)} className="lg:flex-1">
              Отмена
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
