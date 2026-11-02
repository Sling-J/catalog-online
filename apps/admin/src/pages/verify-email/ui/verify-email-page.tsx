import { Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { ResendVerificationButton } from '@/features/resend-verification';
import { ButtonLink, FormFooter } from '@/shared/ui';
import { AuthLayout } from '@/widgets/auth-layout';

export type VerifyEmailResult = { verified: true } | { verified: false; email: string };

/**
 * Переход по ссылке из письма (макет AdminAuth*): «Почта подтверждена» или «Ссылка устарела» с новым письмом.
 * Ссылку проверяет загрузчик маршрута; устаревшая без сессии ведёт на вход (письмо можно отправить только вошедшему).
 */
export function VerifyEmailPage({ result }: { result: VerifyEmailResult }) {
  if (result.verified) {
    return (
      <AuthLayout
        badge="ok"
        title={<Trans>Почта подтверждена</Trans>}
        subtitle={<Trans>Спасибо! Теперь витрину можно опубликовать.</Trans>}
      >
        <ButtonLink to="/" variant="dark" className="mt-6 lg:mt-[26px]">
          <Trans>Перейти в каталог</Trans>
        </ButtonLink>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="warn"
      title={<Trans>Ссылка устарела</Trans>}
      subtitle={
        <Trans>
          Ссылки из писем работают ограниченное время и только один раз. Отправим новое письмо на <b>{result.email}</b>.
        </Trans>
      }
    >
      <ResendVerificationButton />
      <FormFooter>
        <Link to="/" className="font-bold text-iris">
          <Trans>Перейти в каталог</Trans>
        </Link>
      </FormFooter>
    </AuthLayout>
  );
}
