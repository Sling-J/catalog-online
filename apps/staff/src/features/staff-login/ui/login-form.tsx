import { staffLogin } from '@catalog/contract';
import { Button, Field } from '@catalog/ui';
import { useState, type FormEvent } from 'react';

import { statusOf } from '@/shared/api';

/** Вход сотрудника (почта и пароль из `staff:create`). Неверные данные — одна ошибка, без подсказки, что именно. */
export function LoginForm({ onSuccess }: { onSuccess: () => void | Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await staffLogin({ body: { email, password }, throwOnError: true });
      await onSuccess();
    } catch (failure) {
      const status = statusOf(failure);
      setError(
        status === 401 || status === 422
          ? 'Неверная почта или пароль'
          : status === 429
            ? 'Слишком много попыток. Подождите минуту'
            : 'Не получилось войти. Попробуйте ещё раз',
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field
        label="Почта"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Field
        label="Пароль"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={error}
      />
      <Button type="submit" size="form" block disabled={pending || !email || !password}>
        Войти
      </Button>
    </form>
  );
}
