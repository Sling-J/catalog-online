import { staffImpersonateShop } from '@catalog/contract';
import { Button } from '@catalog/ui';
import { useState } from 'react';

/**
 * «Войти от имени» (FR-S3, ADR 0005): API выдаёт ссылку в админку с одноразовым токеном, открываем её в новой вкладке.
 * Вкладку открываем сразу по нажатию, а адрес задаём после ответа — иначе браузер блокирует окно как всплывающее.
 */
export function ImpersonateButton({ shopId, name }: { shopId: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const open = async () => {
    setFailed(false);
    const tab = window.open('', '_blank');
    try {
      const { data } = await staffImpersonateShop({ path: { shopId }, throwOnError: true });
      if (tab) {
        tab.opener = null;
        tab.location.href = data.url;
      } else window.location.href = data.url;
    } catch {
      tab?.close();
      setFailed(true);
    }
  };
  return (
    <>
      <Button variant="soft" size="small" onClick={open} aria-label={`Войти от имени: ${name}`}>
        Войти от имени
      </Button>
      {failed && (
        <span role="alert" className="text-[13px] text-coral-underside">
          Не получилось
        </span>
      )}
    </>
  );
}
