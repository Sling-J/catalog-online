import { LoginForm } from '@/features/staff-login';

/** Вход в суперадминку: только сотрудники, заведённые командой `staff:create` (регистрации нет). */
export function LoginPage({ onSuccess }: { onSuccess: () => void | Promise<void> }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px] rounded-[28px] bg-white p-6 shadow-[0_24px_60px_rgb(40_20_110/0.08)] lg:p-8">
        <h1 className="text-[24px] font-extrabold tracking-[-0.01em]">Суперадминка</h1>
        <p className="mt-1.5 mb-6 text-[15px] text-ink-soft">Вход для сотрудников сервиса</p>
        <LoginForm onSuccess={onSuccess} />
      </div>
    </main>
  );
}
