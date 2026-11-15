import { Trans } from '@lingui/react/macro';

import { AuthLayout } from '@/widgets/auth-layout';

/** Ссылка входа «от имени» (ADR 0005) одноразовая и живёт минуту: устарела — открыть магазин из суперадминки снова. */
export function ImpersonateExpiredPage() {
  return (
    <AuthLayout
      badge="warn"
      title={<Trans>Ссылка устарела</Trans>}
      subtitle={
        <Trans>
          Ссылка входа от имени магазина работает минуту и один раз. Откройте магазин в суперадминке ещё раз.
        </Trans>
      }
    >
      {null}
    </AuthLayout>
  );
}
