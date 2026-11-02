import { createFileRoute } from '@tanstack/react-router';

import { ForgotPasswordPage } from '@/pages/forgot-password';

// Восстановление пароля (FR-A1): открывается и без сессии, и из «Вход и пароль».
export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
});
