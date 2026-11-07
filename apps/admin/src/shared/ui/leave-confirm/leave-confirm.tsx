import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import type { LeaveGuard } from '@/shared/hooks';

import { ConfirmSheet } from '../confirm-sheet';

/** «Уйти без сохранения?» — когда со страницы с правками уходят «Назад», по меню или «Отменить». */
export function LeaveConfirm({ guard, text }: { guard: LeaveGuard; text: ReactNode }) {
  return (
    <ConfirmSheet
      open={guard.blocked}
      title={<Trans>Уйти без сохранения?</Trans>}
      text={text}
      confirm={<Trans>Уйти</Trans>}
      cancel={<Trans>Остаться</Trans>}
      onConfirm={guard.leave}
      onClose={guard.stay}
    />
  );
}
