import { Trans } from '@lingui/react/macro';

import { ConfirmSheet } from '@/shared/ui';

import type { LeaveGuard } from '../../hooks';

/** «Уйти без сохранения?» — когда со страницы с правками уходят «Назад», по меню или «Отменить». */
export function LeaveConfirm({ guard }: { guard: LeaveGuard }) {
  return (
    <ConfirmSheet
      open={guard.blocked}
      title={<Trans>Уйти без сохранения?</Trans>}
      text={<Trans>Правки в карточке пропадут.</Trans>}
      confirm={<Trans>Уйти</Trans>}
      cancel={<Trans>Остаться</Trans>}
      onConfirm={guard.leave}
      onClose={guard.stay}
    />
  );
}
