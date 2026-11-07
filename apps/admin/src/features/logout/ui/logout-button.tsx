import { logoutMutation } from '@catalog/contract/query';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';

/**
 * «Выйти» внизу раздела «Магазин» (макет AdminPhone2, экран 8). После выхода страница входа открывается заново,
 * с нуля: данные магазина не остаются ни в кеше, ни в открытых экранах.
 */
export function LogoutButton({ className }: { className?: string }) {
  const logout = useMutation(logoutMutation());
  return (
    <button
      type="button"
      disabled={logout.isPending}
      className={className}
      onClick={() => logout.mutate({}, { onSettled: () => window.location.assign('/login') })}
    >
      <Trans>Выйти</Trans>
    </button>
  );
}
