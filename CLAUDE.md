# catalog-online

SaaS: онлайн-каталог (товары, размеры, остатки, цены) для малых магазинов из данных их учётной системы. Заказ — заявкой в WhatsApp.

## Начало каждой сессии
1. Прочитай `docs/status.md`: текущая стадия и следующий шаг.
2. Карта документации: `docs/README.md`. Процесс: `docs/06-process/workflow.md`. Грабли прошлых сессий (окружение, сборка, проверка) — `docs/06-process/pitfalls.md`.
3. Перед задачей — документы её темы из таблицы «Где что лежит» ниже и стек в `docs/02-architecture/adr/0001-stack.md`. Перед кодом фронта — `docs/02-architecture/frontend-structure.md`, перед кодом бэка — `docs/02-architecture/backend-structure.md`.

## Правила работы
- Работаем в паре с основателем (опытный разработчик). Основателей двое: второй — сооснователь, автор идеи продукта; предлагает и обсуждает идеи в issue на GitHub, решения по продукту основатели принимают вместе (`docs/06-process/roles.md`). На развилках (продукт, UX, архитектура, стек, зависимости) предлагай вариант с рекомендацией и спрашивай. Детали внутри согласованного плана решай сам.
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
| Экраны и решения по витрине и админке | `docs/04-design/storefront.md`, `admin.md`; макеты — холст на claude.ai, референс стиля (ссылка и правила — `docs/04-design/README.md`) |
| Стек и архитектурные решения | `docs/02-architecture/adr/` |
| Структура кода фронтов (FSD) | `docs/02-architecture/frontend-structure.md` (ADR 0002); суперадминка — отдельное приложение (ADR 0005) |
| Структура кода бэкенда (модули Nest) | `docs/02-architecture/backend-structure.md` (ADR 0004) |
| Модель данных, соглашения API | `docs/02-architecture/data-model.md`, `api.md`; контракт — `packages/contract/openapi.yaml` |
| План и задачи | `docs/05-tasks/roadmap.md`, `backlog.md` |
| Нерешённое | `docs/open-questions.md` |
| Идеи по интерфейсу, которых ещё нет в продукте | `docs/ideas.md` |
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
- Перед коммитом: `pnpm check` проходит и документы не противоречат коду и друг другу.

## Команды
Монорепо pnpm + Turborepo, Node ≥ 22.19 (`docs/02-architecture/adr/0001-stack.md`).
- `pnpm install` — зависимости.
- `pnpm generate` — код из `packages/contract/openapi.yaml` (Hey API) в `packages/contract/src/gen` (в git не хранится, turbo запускает сам перед проверками).
- `pnpm check` — проверка документов + Prettier (`format:check`) + lint + typecheck + test + build по всем пакетам; перед коммитом должен проходить.
- `pnpm docs:check` — ссылки, front matter и оглавления в документах (`tools/docs-check`).
- `pnpm format` / `pnpm format:check` — Prettier.
- `pnpm i18n:extract` — строки Lingui в каталоги `.po`.
- `docker compose up -d` — PostgreSQL и S3-хранилище для разработки (`.env.example`).
- `pnpm dev` — API, витрина, админка и суперадминка (`staff.localhost:3003`); фронты на настоящем API (нужны `docker compose up -d`, миграции, `db:seed`). Моки MSW — `vite --mode mocks` (конфигурации `admin-check` :3012 и `web-mocks` :3010 в `.claude/launch.json`).
- `pnpm e2e` — сценарии в браузере на настоящем API (`tools/e2e`, своя база `catalog_e2e`, продакшен-сборки фронтов; нужны `docker compose up -d` и Chrome); после правок фронтов, в `pnpm check` не входит.
- `pnpm --filter @catalog/api dev` — API на :3001 и процесс фоновых задач `worker.ts` (корневой `.env`); `db:generate` / `db:migrate` — миграции drizzle-kit, `db:studio` — база в браузере (Drizzle Studio, https://local.drizzle.studio), `db:seed` — демо-магазины (вход как на моках), их фото и сотрудник суперадминки, `demo:publish` — демо для лендинга на продакшене (войти нельзя; в базе разработки не запускать), `storage:setup` — хранилища разработки (один раз), `staff:create <почта>` — сотрудник суперадминки (пароль спросит). Тесты API (в `pnpm check`) — на Testcontainers, нужен запущенный Docker.

## Код
- Контракт API правится только в `openapi.yaml`, затем `pnpm generate`; сгенерированное (`*.gen.ts`) руками не трогаем.
- Демо-данные «Айгерим Kids» для моков — `@catalog/contract/fixtures`, обработчики MSW — `@catalog/contract/msw`. В разработке приложения берут контракт из `src/` (условие `development` в `exports`), пересобирать после правок моков не нужно; `tsc` приложений по-прежнему смотрит на `dist` — его обновляет `pnpm check` / `pnpm build`.
- Сообщения превью админка ↔ витрина (`postMessage`) — `@catalog/contract/preview` (Zod), не в `openapi.yaml`.
- Код `apps/web`, `apps/admin` и `apps/staff` — по FSD (`docs/02-architecture/frontend-structure.md`): слои `app → pages → widgets → features → entities → shared`, без импортов между срезами одного слоя, снаружи среза только через его `index.ts`, алиас `@/*` → `src/*`. Границы проверяет `pnpm lint` (`eslint.fsd.js`).
- Токены дизайн-системы — `packages/ui/src/tokens.css` (Tailwind v4 `@theme`), источник — `DESIGN.md`.
- Формы админки — TanStack Form через `useAppForm` из `@/shared/ui` (ADR 0003): проверка в `validators.onSubmit`, отправка `submitForm`, ошибки сервера `setServerError` / `setFormError`. Уход с несохранёнными правками — `useLeaveGuard` из `@/shared/hooks` и `LeaveConfirm` из `@/shared/ui`; общие поля форм (`TextAreaField`, `FieldLabel`, `FieldNote`, `SaveBar`) — там же.
- Суперадминка (`apps/staff`, ADR 0005): строки без Lingui (плагин Lingui в сборке только для `@catalog/ui`), без моков и TanStack Form; вход «от имени» — ссылка с одноразовым токеном из `staffImpersonateShop`, админка меняет его на сессию на `/impersonate`.
- Ссылка на витрину в админке — только `StorefrontLink` из `@/entities/shop`: до публикации он сам ведёт в превью (`?preview=<токен>`), обычный адрес черновика покупателю не отвечает (A32).
- Файл в хранилище (API2) — `uploadFile` из `@/shared/api`; перетаскивание в админке — `@dnd-kit/react` (ADR 0001, пример — `features/product-photos/ui/sortable-photos`).
- Выпадающий список — `Select` из `@catalog/ui` (панель на компьютере, шторка на телефоне, действия под чертой — `actions`), не системный `<select>`. Копирование с отметкой «Скопировано» — `useCopied` из `@/shared/hooks`.
- `apps/api` — по `docs/02-architecture/backend-structure.md` (ADR 0004): модуль на тег контракта, контроллер `implements <Тег>ControllerMethods` → сервис → репозиторий (`shopId` первым после `db`). Границы — `eslint.api.js`. Вход проверяется схемой в декораторе `@Body({ schema: zXxxBody })` / `@Query({ schema })` из `@catalog/contract/zod`; ошибки — `throw new AppError('code', status)` из `core/errors` (новый код — сначала в `openapi.yaml`); строгое ограничение частоты — `@RateLimit(n, ms)`; только для вошедшего магазина — `@Authenticated()`, магазин и аккаунт — `RequestContext` (`ctx.shopId()`, `ctx.session()`) в контроллере; письма — задачей (`auth.mail`, `jobs.send` в транзакции), `Mailer` из `core/mail` — только в обработчике задачи (T-609); только для сотрудника суперадминки — `@StaffAuthenticated()`, сотрудник — `ctx.staffId()`; вход «от имени» — `SessionService.startImpersonated`, запреты для него — по `session.impersonated` в сервисе; типы контроллеров — `@catalog/contract/nest`; в e2e вошедший магазин — `signUp` из `test/helpers/session.ts`; файлы — `Storage` из `core/storage` (в e2e — `t.storage` в памяти), принять `uploadId` — `UploadsService.consume`; фоновая задача — `defineJob` в `workers/` модуля, `jobs.work` / `jobs.schedule` в `onModuleInit`, `jobs.send(задача, данные, tx)` (в e2e — `t.jobs.run`); выполняет задачи только процесс `worker.ts` (`jobsRole: 'work'`), API их только ставит (T-607); картинки — `Images` из `core/images` (`publish` / `remove` / `toImage`; сжатие само идёт в отдельном потоке — `renderImageIsolated`); кешируемое публичное чтение — `@PublicCache()` из `core/http` (с `?preview=` — `no-store`); курсор списка — `encodeCursor` / `decodeCursor` из `core/pagination`, id в адресе — `@Param(PathIds) path`; конфиг — `AppConfig`, не `process.env`; ответы в разработке и тестах сверяются со схемой контракта по имени метода контроллера (= `operationId`), лишнее поле — 500; новый закрытый маршрут сам попадает в проверку 401 (`core/auth/authenticated.e2e.test.ts`), публичный — добавить в её список; коды ответов сверяются с контрактом на каждом e2e, а после полного прогона каждый объявленный код (кроме 500) должен быть получен хоть одним тестом — новый код в `openapi.yaml` требует теста (общие 401 / 403 / 429 / 500 — правилом, `api.md`, «Коды ответов»). Импорты в api — относительные с `.js`; классы, которые Nest внедряет, — обычным `import`, не `import type`.
- Импорт (`modules/imports`) в каталог сам не пишет: строки → `ProductImportService` модуля товаров (`preview` / `apply`), правила — `products/lib/import-plan.ts` и `docs/02-architecture/api.md`, «Импорт»; статус импорта меняется только `importsRepository.transition` (условный переход).
- e2e (`tools/e2e`): тест — `test` из `fixtures/test.ts`, в нём журнал `api` сам ловит дубли, прерванные запросы, `OPTIONS` перед `GET` и неожиданные ошибки; на шагах — `api.expectRequests(действие, [точный список])`; ожидаемый 4xx — `api.allowStatus`, законный опрос — `api.allowRepeat`. Данные — свой магазин через `newShop` (демо-магазин сида только читаем), письма — `readMail`. Новый экран или действие во фронте — сценарий с точным списком запросов. После правки товаров — `invalidateProducts(queryClient, { counts })`: счётчики и чек-лист только если менялись видимость, остатки или фото; ответ API с магазином — `applyShop` (без перечитывания `me`), с импортом — `applyImport` (и в историю).
- Общее для витрины и админки без бизнес-контекста (базовые компоненты, `Icon`, `Select`, `ChangingValue`, `useIsDesktop`, `useLoadMore`, `formatPrice`) — в `@catalog/ui`, не копией в каждом приложении.
