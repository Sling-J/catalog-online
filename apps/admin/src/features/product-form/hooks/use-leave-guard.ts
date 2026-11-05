import { useBlocker } from '@tanstack/react-router';
import { useRef } from 'react';

/**
 * Уход со страницы с несохранёнными правками: переход внутри админки ждёт подтверждения (`status: 'blocked'`),
 * закрытие вкладки — вопрос браузера. После сохранения или удаления уход разрешают `allow()`.
 */
export function useLeaveGuard(dirty: boolean) {
  const allowed = useRef(false);
  const blocker = useBlocker({
    shouldBlockFn: () => dirty && !allowed.current,
    enableBeforeUnload: () => dirty && !allowed.current,
    withResolver: true,
  });
  return {
    blocked: blocker.status === 'blocked',
    stay: () => blocker.reset?.(),
    leave: () => blocker.proceed?.(),
    allow: () => {
      allowed.current = true;
    },
  };
}

export type LeaveGuard = ReturnType<typeof useLeaveGuard>;
