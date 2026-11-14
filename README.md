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
| `apps/api` | API — NestJS + PostgreSQL (Drizzle); код — модули по областям, контроллер → сервис → репозиторий ([ADR 0004](docs/02-architecture/adr/0004-backend-structure.md)) |
| `packages/ui` | Токены дизайн-системы, общие компоненты, иконки и хуки витрины и админки |
| `packages/contract` | Контракт API `openapi.yaml` и сгенерированный код. В разработке (Vite, Vitest) приложения берут исходники `src/` — условие `development` в `exports`, правки моков видны без сборки; сборка и проверка типов — из `dist` |
| `tools/e2e` | Сценарии в браузере на Playwright (`pnpm e2e`): админка на моках (`--mode mocks`) — онбординг, «Товары»; на настоящем API — T-502 |
| `tools/docs-check` | Проверка документации (`pnpm docs:check`, входит в `pnpm check`): ссылки, front matter, оглавления разделов, статусы ADR — правила в `docs/06-process/documentation-rules.md` |
| `tools/design-compare` | Сверка экрана приложения с артбордом холста (`pnpm design:compare`, описание — README папки) |

## Что нужно для разработки
- Node.js 22 LTS или новее (версиями удобно управлять через nvm; на Windows — nvm-windows)
- pnpm 10: `corepack enable`, версия берётся из `packageManager` в `package.json`, поэтому команды `pnpm` запускайте из каталога репозитория (вне проекта `corepack` выберет самую свежую версию, она может не запуститься; закрепить нужную: `corepack prepare pnpm@10.18.1 --activate`)
- Docker — для PostgreSQL и S3-хранилища (в разработке SeaweedFS) и для тестов API (`pnpm check` без запущенного Docker не пройдёт)

## Команды
| Команда | Что делает |
|---|---|
| `pnpm install` | Установить зависимости |
| `pnpm generate` | Код из `packages/contract/openapi.yaml` (Hey API): типы, SDK, хуки Query, Zod, MSW, типы для Nest |
| `pnpm check` | Проверка документации, линтеры (включая контракт и границы FSD), типы, тесты и сборка всех пакетов |
| `pnpm docs:check` | Только проверка документации: битые ссылки, front matter, оглавления разделов, статусы в журнале ADR |
| `pnpm dev` | Запустить API (http://localhost:3001), `apps/web` (http://localhost:3000) и `apps/admin` (http://app.localhost:3002) — фронты на настоящем API (T-501): нужны `docker compose up -d --wait`, миграции и `db:seed`. Админка шлёт запросы на свой адрес, Vite пересылает `/v1` на API (cookie сессии — первая сторона, CORS не нужен); витрина ходит в API напрямую. Вход демо-владельца — `aigerim.kids@example.com` / `demo-password` (из сида), письма (подтверждение, сброс пароля) — в логе API. Витрина демо-магазина — http://aigerim-kids.localhost:3000, лендинг — http://localhost:3000. **Моки MSW** (без API) — режим `--mode mocks` (`apps/*/.env.mocks`): `pnpm --filter @catalog/admin exec vite --mode mocks`, `pnpm --filter @catalog/web exec vite dev --mode mocks`; готовые конфигурации — `admin-check` (http://localhost:3012) и `web-mocks` (http://aigerim-kids.localhost:3010) в `.claude/launch.json`. На моках в админке по умолчанию вошёл владелец демо-магазина; сессия моков — в `localStorage` (`catalog-admin-mock-session`: `{"kind":"out"}` — вышли); ссылки из писем — http://localhost:3012/verify-email?token=abc и …/reset-password?token=abc (токен `expired` — ссылка устарела); адреса `aigerim-kids` и `skrytyj-magazin` заняты; главная до публикации — `localStorage.setItem('catalog-admin-mock-session', '{"kind":"demo","draft":true}')`; превью скрытого магазина — http://skrytyj-magazin.localhost:3010/?preview=demo. Переменные фронтов — в `.env.example` |
| `pnpm design:compare` | Сверка экрана с макетом: `--board <доска> --frame <экран> --url <адрес>` — расхождения положения, размера, шрифта, цвета и подложки по тексту (нужен установленный Google Chrome и запущенный дев-сервер; `tools/design-compare/README.md`). Сверяем на моках: админку — http://localhost:3012 (конфигурация `admin-check`), витрину — http://aigerim-kids.localhost:3010 (`web-mocks`), обе в `.claude/launch.json` |
| `pnpm e2e` | Сценарии в браузере (`tools/e2e`, Playwright, телефон 390 и компьютер 1440): сам поднимает дев-сервер админки на моках (`--mode mocks`) на http://localhost:3022 (уже запущенный — переиспользует), нужен установленный Google Chrome. В `pnpm check` не входит; запускать после правок админки |
| `pnpm format` | Prettier |
| `pnpm i18n:extract` | Строки Lingui в каталоги `.po` (`apps/web` и `apps/admin`: `src/app/i18n/locales`, общий каталог — `packages/ui/src/locales`; каталоги в git, после правки строк запустить и закоммитить) |
| `docker compose up -d --wait` | PostgreSQL и S3-хранилище для разработки (настройки — `.env.example`); `--wait` — дождаться готовности |
| `pnpm --filter @catalog/api dev` | API на http://localhost:3001 (`tsc --watch` + `node --watch`; переменные — корневой `.env`, образец — `.env.example`; проверка — http://localhost:3001/health). Входит и в `pnpm dev`. В разработке каждый ответ сверяется со схемой контракта: расхождение — 500 `internal_error`, что именно не так — в логе API. Контракт API берёт из `dist`: после правки `openapi.yaml` — `pnpm generate` и `pnpm --filter @catalog/contract build` |
| `pnpm --filter @catalog/api db:generate` / `db:migrate` | Миграция из схемы `apps/api/src/core/db/schema` (drizzle-kit, в `apps/api/drizzle`) / применить к базе из `DATABASE_URL`. Сразу после `docker compose up` база ещё стартует — поднимать с `--wait` |
| Токен превью витрины | Подписывается `APP_SECRET` (не короче 32 символов; в `.env.example` — значение для разработки, в продакшене — свой случайный) |
| Письма API в разработке | Без `SMTP_URL` письма (подтверждение почты, новый пароль) пишутся в лог API — ссылку из лога можно открыть в админке; адрес админки для ссылок — `ADMIN_URL` |
| `pnpm --filter @catalog/api storage:setup` | Подготовить хранилище разработки (один раз): создать публичное и закрытое хранилища, разрешить загрузку из браузера (CORS). После `docker compose up` SeaweedFS отвечает не сразу — секунд 15 |
| `pnpm --filter @catalog/api db:studio` | Drizzle Studio — посмотреть и поправить базу из `DATABASE_URL` в браузере: https://local.drizzle.studio (сервер на `127.0.0.1:4983`, другой порт — `db:studio --port=3000`). Интерфейс грузится с сайта Drizzle, данные идут только в локальный сервер; Brave и Safari могут блокировать localhost — открывать в Chrome |
| `pnpm --filter @catalog/api db:seed` | Демо-магазины в базу (после `db:migrate`): «Айгерим Kids» — вход `aigerim.kids@example.com` / `demo-password`, и скрытый `skrytyj-magazin`, сотрудник суперадминки `staff@example.com` / `staff-password`. Повторный запуск пересоздаёт магазины; фото демо-магазина кладёт в публичное хранилище (нужен `storage:setup`) |
| `pnpm --filter @catalog/api staff:create <почта>` | Сотрудник суперадминки в базу из `DATABASE_URL`, пароль (от 12 символов) спрашивается в терминале без эха; почта уже есть — новый пароль. Без терминала — первая строка ввода: `echo 'пароль' \| pnpm --filter @catalog/api staff:create почта` |
| `pnpm --filter @catalog/api test` | Тесты API: `unit` и `e2e` на PostgreSQL в контейнере (Testcontainers) — нужен запущенный Docker; входит в `pnpm check` |
