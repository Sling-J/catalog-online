# catalog-online

SaaS: онлайн-каталог (товары, размеры, остатки, цены) для малых магазинов из данных их учётной системы. Заказ — заявкой в WhatsApp.

## Начало каждой сессии
1. Прочитай `docs/status.md`: текущая стадия и следующий шаг.
2. Карта документации: `docs/README.md`. Процесс: `docs/06-process/workflow.md`. Грабли прошлых сессий (окружение, сборка, проверка) — `docs/06-process/pitfalls.md`.
3. Перед задачей — документы её темы из таблицы «Где что лежит» ниже и стек в `docs/02-architecture/adr/0001-stack.md`. Перед кодом фронта — `docs/02-architecture/frontend-structure.md`, перед кодом бэка — `docs/02-architecture/backend-structure.md`.

## Правила работы
- Работаем в паре с основателем (опытный разработчик). На развилках (продукт, UX, архитектура, стек, зависимости) предлагай вариант с рекомендацией и спрашивай. Детали внутри согласованного плана решай сам.
- Не застревай на блокерах: записывай в `docs/open-questions.md` и двигайся дальше.
- Решения, не записанные в `docs/`, считаются не принятыми. Принятые (`status: accepted`) документы и ADR меняются только с согласия основателя.
- Правила оформления документов: `docs/06-process/documentation-rules.md`.
- Язык документов и общения: русский.
- В конце сессии обнови `docs/status.md`.
- Документацию библиотек и фреймворков смотри через Context7 MCP, а не по памяти.
- Что-то не запустилось, упало или пришлось обходить (команда, сборка, проверка, поведение библиотеки) — сразу запиши в `docs/06-process/pitfalls.md`: что случилось → почему → как правильно. Продуктовые решения туда не пишем.

## Документация всегда актуальна
Цель: в новой сессии проект понятен из документов, без пересказа. Устаревший документ хуже отсутствующего.

Где что лежит (источник правды):
| Что | Где |
|---|---|
| Где мы сейчас и что дальше | `docs/status.md` (коротко, только текущее) |
| Что уже сделано, по эпикам | `docs/changelog.md` |
| Продукт: объём MVP, решения D…, требования, сценарии | `docs/01-product/` |
| Контекст продукта для дизайна | `PRODUCT.md` |
| Дизайн-система | `DESIGN.md` (+ `.impeccable/design.json`, токены в коде — `packages/ui/src/tokens.css`) |
| Экраны и решения по витрине и админке | `docs/04-design/storefront.md`, `admin.md`; макеты (вёрстка) — `design/canvas/` (копия холста, см. её README) |
| Стек и архитектурные решения | `docs/02-architecture/adr/` |
| Структура кода фронтов (FSD) | `docs/02-architecture/frontend-structure.md` (ADR 0002) |
| Структура кода бэкенда (модули Nest) | `docs/02-architecture/backend-structure.md` (ADR 0004) |
| Модель данных, соглашения API | `docs/02-architecture/data-model.md`, `api.md`; контракт — `packages/contract/openapi.yaml` |
| План и задачи | `docs/05-tasks/roadmap.md`, `backlog.md` |
| Нерешённое | `docs/open-questions.md` |
| Идеи по интерфейсу, которых нет в макетах (сначала макет, потом код) | `docs/ideas.md` |
| Устройство кода и команды | `README.md`, раздел «Команды» ниже |

Правила (подробно — `docs/06-process/documentation-rules.md`):
- **Один факт — одно место:** остальные документы ссылаются, а не пересказывают (состояние — только в `status.md`, что сделано — только в `changelog.md`).
- **После каждого изменения — сразу обновить документы, которых оно касается**, в том же коммите, что и код. Не откладывать «на конец сессии».
- Новое решение основателя записывается туда, где живёт тема (таблица решений документа, ADR, `mvp-scope.md`), с датой. Решение, которого нет в `docs/`, считается не принятым.
- Изменилось решение — найти и поправить все места, где упоминалось старое (поиск по ключевым словам по `docs/`, `PRODUCT.md`, `DESIGN.md`, `README.md`). Старое в принятых документах зачёркиваем со ссылкой на новое, а не удаляем молча.
- Принятые документы и ADR меняем только с согласия основателя; фактические поправки (устаревшая ссылка, сломанный образ) — примечанием с датой.
- Задача закрыта → галочка в `backlog.md` (строка задачи не растёт), в `changelog.md` — что сделано, решения по ходу, что не сделано, как проверено; в `status.md` — «Последнее» и «Следующий шаг» (историю там не копим).
- Появилась команда, пакет, переменная окружения, договорённость по коду → `README.md` и разделы «Команды» и «Код» ниже, `.env.example`.
- Новый документ → строка в `README.md` своего раздела и, если раздел новый, в `docs/README.md`. В оглавлениях — только существующие файлы.
- Изменился макет на холсте → обновить копию в `design/canvas/` (и наоборот), в том же коммите.
- Перед коммитом: `pnpm check` проходит и документы не противоречат коду и друг другу.

## Команды
Монорепо pnpm + Turborepo, Node ≥ 22.19 (`docs/02-architecture/adr/0001-stack.md`).
- `pnpm install` — зависимости.
- `pnpm generate` — код из `packages/contract/openapi.yaml` (Hey API) в `packages/contract/src/gen` (в git не хранится, turbo запускает сам перед проверками).
- `pnpm check` — проверка документов + lint + typecheck + test + build по всем пакетам; перед коммитом должен проходить.
- `pnpm docs:check` — ссылки, front matter и оглавления в документах (`tools/docs-check`).
- `pnpm format` / `pnpm format:check` — Prettier.
- `pnpm i18n:extract` — строки Lingui в каталоги `.po`.
- `docker compose up -d` — PostgreSQL и S3-хранилище для разработки (`.env.example`).
- `pnpm e2e` — сценарии в браузере (`tools/e2e`, Playwright на моках); после правок админки, в `pnpm check` не входит.
- `pnpm --filter @catalog/api dev` — API на :3001 (корневой `.env`); `db:generate` / `db:migrate` — миграции drizzle-kit, `db:seed` — демо-магазины (вход как на моках) и их фото, `storage:setup` — хранилища разработки (один раз). Тесты API (в `pnpm check`) — на Testcontainers, нужен запущенный Docker.
- `pnpm design:compare --board <доска> --frame <экран> --url <адрес>` — сверка экрана с макетом (`tools/design-compare/README.md`); после вёрстки по макету — обязательно, вместо ручных замеров в браузере. Админку сверяем на http://localhost:3012 (`admin-check`).

## Код
- Контракт API правится только в `openapi.yaml`, затем `pnpm generate`; сгенерированное (`*.gen.ts`) руками не трогаем.
- Демо-данные «Айгерим Kids» для моков — `@catalog/contract/fixtures`, обработчики MSW — `@catalog/contract/msw`. В разработке приложения берут контракт из `src/` (условие `development` в `exports`), пересобирать после правок моков не нужно; `tsc` приложений по-прежнему смотрит на `dist` — его обновляет `pnpm check` / `pnpm build`.
- Сообщения превью админка ↔ витрина (`postMessage`) — `@catalog/contract/preview` (Zod), не в `openapi.yaml`.
- Код `apps/web` и `apps/admin` — по FSD (`docs/02-architecture/frontend-structure.md`): слои `app → pages → widgets → features → entities → shared`, без импортов между срезами одного слоя, снаружи среза только через его `index.ts`, алиас `@/*` → `src/*`. Границы проверяет `pnpm lint` (`eslint.fsd.js`).
- Токены дизайн-системы — `packages/ui/src/tokens.css` (Tailwind v4 `@theme`), источник — `DESIGN.md`.
- Формы админки — TanStack Form через `useAppForm` из `@/shared/ui` (ADR 0003): проверка в `validators.onSubmit`, отправка `submitForm`, ошибки сервера `setServerError` / `setFormError`. Уход с несохранёнными правками — `useLeaveGuard` из `@/shared/hooks` и `LeaveConfirm` из `@/shared/ui`; общие поля форм (`TextAreaField`, `FieldLabel`, `FieldNote`, `SaveBar`) — там же.
- Ссылка на витрину в админке — только `StorefrontLink` из `@/entities/shop`: до публикации он сам ведёт в превью (`?preview=<токен>`), обычный адрес черновика покупателю не отвечает (A32).
- Файл в хранилище (API2) — `uploadFile` из `@/shared/api`; перетаскивание в админке — `@dnd-kit/react` (ADR 0001, пример — `features/product-photos/ui/sortable-photos`).
- Выпадающий список — `Select` из `@catalog/ui` (панель на компьютере, шторка на телефоне, действия под чертой — `actions`), не системный `<select>`. Копирование с отметкой «Скопировано» — `useCopied` из `@/shared/hooks`.
- `apps/api` — по `docs/02-architecture/backend-structure.md` (ADR 0004): модуль на тег контракта, контроллер `implements <Тег>ControllerMethods` → сервис → репозиторий (`shopId` первым после `db`). Границы — `eslint.api.js`. Вход проверяется схемой в декораторе `@Body({ schema: zXxxBody })` / `@Query({ schema })` из `@catalog/contract/zod`; ошибки — `throw new AppError('code', status)` из `core/errors` (новый код — сначала в `openapi.yaml`); строгое ограничение частоты — `@RateLimit(n, ms)`; только для вошедшего магазина — `@Authenticated()`, магазин и аккаунт — `RequestContext` (`ctx.shopId()`, `ctx.session()`) в контроллере; письма — `Mailer` из `core/mail`; типы контроллеров — `@catalog/contract/nest`; в e2e вошедший магазин — `signUp` из `test/helpers/session.ts`; файлы — `Storage` из `core/storage` (в e2e — `t.storage` в памяти), принять `uploadId` — `UploadsService.consume`; конфиг — `AppConfig`, не `process.env`. Импорты в api — относительные с `.js`; классы, которые Nest внедряет, — обычным `import`, не `import type`.
- Общее для витрины и админки без бизнес-контекста (базовые компоненты, `Icon`, `Select`, `ChangingValue`, `useIsDesktop`, `useLoadMore`, `formatPrice`) — в `@catalog/ui`, не копией в каждом приложении.
