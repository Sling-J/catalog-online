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
| `apps/admin` | Админка магазина — Vite + React SPA; код по FSD |
| `apps/api` | API — NestJS + PostgreSQL (Drizzle) |
| `packages/ui` | Токены дизайн-системы и общие компоненты |
| `packages/contract` | Контракт API `openapi.yaml` и сгенерированный код |

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
| `pnpm dev` | Запустить приложения: `apps/web` на http://localhost:3000 с моками API (admin и api появятся в E3, E4). Витрина демо-магазина — http://aigerim-kids.localhost:3000, лендинг — http://localhost:3000 |
| `pnpm format` | Prettier |
| `pnpm i18n:extract` | Строки Lingui в каталоги `.po` (`apps/web`: `src/app/i18n/locales`, общий каталог — `packages/ui/src/locales`; каталоги в git, после правки строк запустить и закоммитить) |
| `docker compose up -d` | PostgreSQL и S3-хранилище для разработки (настройки — `.env.example`) |
