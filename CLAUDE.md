# catalog-online

SaaS: онлайн-каталог (товары, размеры, остатки, цены) для малых магазинов из данных их учётной системы. Заказ — заявкой в WhatsApp.

## Начало каждой сессии
1. Прочитай `docs/status.md`: текущая стадия и следующий шаг.
2. Карта документации: `docs/README.md`. Процесс: `docs/06-process/workflow.md`.

## Правила работы
- Работаем в паре с основателем (опытный разработчик). На развилках (продукт, UX, архитектура, стек, зависимости) предлагай вариант с рекомендацией и спрашивай. Детали внутри согласованного плана решай сам.
- Не застревай на блокерах: записывай в `docs/open-questions.md` и двигайся дальше.
- Решения, не записанные в `docs/`, считаются не принятыми. Принятые (`status: accepted`) документы и ADR меняются только с согласия основателя.
- Правила оформления документов: `docs/06-process/documentation-rules.md`.
- Язык документов и общения: русский.
- В конце сессии обнови `docs/status.md`.
- Документацию библиотек и фреймворков смотри через Context7 MCP, а не по памяти.

## Команды
Монорепо pnpm + Turborepo, Node ≥ 22.19 (`docs/02-architecture/adr/0001-stack.md`).
- `pnpm install` — зависимости.
- `pnpm generate` — код из `packages/contract/openapi.yaml` (Hey API) в `packages/contract/src/gen` (в git не хранится, turbo запускает сам перед проверками).
- `pnpm check` — lint + typecheck + test + build по всем пакетам; перед коммитом должен проходить.
- `pnpm format` / `pnpm format:check` — Prettier.
- `pnpm i18n:extract` — строки Lingui в каталоги `.po`.
- `docker compose up -d` — PostgreSQL и S3-хранилище для разработки (`.env.example`).

## Код
- Контракт API правится только в `openapi.yaml`, затем `pnpm generate`; сгенерированное (`*.gen.ts`) руками не трогаем.
- Демо-данные «Айгерим Kids» для моков — `@catalog/contract/fixtures`, обработчики MSW — `@catalog/contract/msw`.
- Токены дизайн-системы — `packages/ui/src/tokens.css` (Tailwind v4 `@theme`), источник — `DESIGN.md`.
