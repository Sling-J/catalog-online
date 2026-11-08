# catalog-online

SaaS для малых магазинов Казахстана: онлайн-каталог (товары, размеры, остатки, цены) из Excel или выгрузки учётной программы. Покупатель собирает корзину и отправляет заказ в WhatsApp магазина, без онлайн-оплаты.

Статус: документация, дизайн и архитектура готовы, идёт разработка (стадия 5). Текущий шаг — [docs/status.md](docs/status.md).

## Документация
- Карта и порядок чтения: [docs/README.md](docs/README.md)
- Требования: [docs/01-product/](docs/01-product/)
- Архитектура, стек, модель данных, API: [docs/02-architecture/](docs/02-architecture/)
- Дизайн: [DESIGN.md](DESIGN.md), [docs/04-design/](docs/04-design/), макеты — [design/canvas/](design/canvas/README.md)
- План и задачи: [docs/05-tasks/backlog.md](docs/05-tasks/backlog.md)

## Устройство репозитория
Монорепо на pnpm + Turborepo ([ADR 0001](docs/02-architecture/adr/0001-stack.md)):

| Путь | Что это |
|---|---|
| `apps/web` | Лендинг и витрины магазинов — TanStack Start (SSR); код по FSD |
| `apps/admin` | Админка магазина — Vite + React SPA; код по FSD, формы на TanStack Form ([ADR 0003](docs/02-architecture/adr/0003-forms-tanstack-form.md)), перетаскивание — `@dnd-kit/react` |
| `apps/api` | API — NestJS + PostgreSQL (Drizzle) |
| `packages/ui` | Токены дизайн-системы, общие компоненты, иконки и хуки витрины и админки |
| `packages/contract` | Контракт API `openapi.yaml` и сгенерированный код. В разработке (Vite, Vitest) приложения берут исходники `src/` — условие `development` в `exports`, правки моков видны без сборки; сборка и проверка типов — из `dist` |
| `tools/e2e` | Сценарии в браузере на Playwright (`pnpm e2e`): пока админка на моках — онбординг, «Товары» |
| `tools/design-compare` | Сверка экрана приложения с артбордом холста (`pnpm design:compare`, описание — README папки) |

## Что нужно для разработки
- Node.js 22 LTS или новее (версиями удобно управлять через nvm; на Windows — nvm-windows)
- pnpm 10: `corepack enable`, версия берётся из `packageManager` в `package.json`, поэтому команды `pnpm` запускайте из каталога репозитория (вне проекта `corepack` выберет самую свежую версию, она может не запуститься; закрепить нужную: `corepack prepare pnpm@10.18.1 --activate`)
- Docker — для PostgreSQL и S3-хранилища (в разработке SeaweedFS)

## Команды
| Команда | Что делает |
|---|---|
| `pnpm install` | Установить зависимости |
| `pnpm generate` | Код из `packages/contract/openapi.yaml` (Hey API): типы, SDK, хуки Query, Zod, MSW, типы для Nest |
| `pnpm check` | Линтеры (включая контракт и границы FSD), типы, тесты и сборка всех пакетов |
| `pnpm dev` | Запустить приложения: `apps/web` на http://localhost:3000 и `apps/admin` на http://app.localhost:3002, оба с моками API (api появится в E4). В админке на моках по умолчанию вошёл владелец демо-магазина; сессия моков — в `localStorage` (`catalog-admin-mock-session`: `{"kind":"out"}` — вышли), вход демо-владельца — `aigerim.kids@example.com` / `demo-password` (`DEMO_ADMIN_PASSWORD` в `packages/contract/src/fixtures/admin-handlers.ts`). Ссылки из писем на моках: http://app.localhost:3002/verify-email?token=abc и http://app.localhost:3002/reset-password?token=abc; токен `expired` — ссылка устарела. Мастер на моках: адреса `aigerim-kids` и `skrytyj-magazin` заняты, служебные (`www`, `app`, `api`, `admin`…) зарезервированы; логотип живёт только до перезагрузки. Главная до публикации на демо-данных: `localStorage.setItem('catalog-admin-mock-session', '{"kind":"demo","draft":true}')`; новый магазин на моках опубликовать нельзя (товаров нет). Витрина демо-магазина — http://aigerim-kids.localhost:3000, лендинг — http://localhost:3000, превью скрытого магазина (как из админки) — http://skrytyj-magazin.localhost:3000/?preview=demo. Переменные фронтов (`VITE_ROOT_DOMAIN`, `VITE_ADMIN_ORIGIN`, `VITE_STOREFRONT_PORT`, `VITE_DEMO_SHOP`, `VITE_API_URL`) — в `.env.example` |
| `pnpm design:compare` | Сверка экрана с макетом: `--board <доска> --frame <экран> --url <адрес>` — расхождения положения, размера, шрифта, цвета и подложки по тексту (нужен установленный Google Chrome и запущенный дев-сервер; `tools/design-compare/README.md`). Админку сверяем на http://localhost:3012 (конфигурация `admin-check` в `.claude/launch.json`): на `app.localhost` во встроенном браузере service worker моков не регистрируется |
| `pnpm e2e` | Сценарии в браузере (`tools/e2e`, Playwright, телефон 390 и компьютер 1440): сам поднимает дев-сервер админки на моках на http://localhost:3022 (уже запущенный — переиспользует), нужен установленный Google Chrome. В `pnpm check` не входит; запускать после правок админки |
| `pnpm format` | Prettier |
| `pnpm i18n:extract` | Строки Lingui в каталоги `.po` (`apps/web` и `apps/admin`: `src/app/i18n/locales`, общий каталог — `packages/ui/src/locales`; каталоги в git, после правки строк запустить и закоммитить) |
| `docker compose up -d` | PostgreSQL и S3-хранилище для разработки (настройки — `.env.example`) |
