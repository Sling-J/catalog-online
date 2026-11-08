---
status: accepted
owner: founder
updated: 2026-11-02
---

# Структура кода фронтенда (FSD)

Правила для `apps/web` и `apps/admin`. Основа — Feature-Sliced Design с поправками основателя; решение — [ADR 0002](adr/0002-frontend-fsd.md). Правила перенесены из другого проекта основателя и адаптированы: React DOM вместо React Native, TanStack Start / Router, TanStack Query, сгенерированный SDK. Что считать нарушением, ловит линтер (см. раздел 9).

## 1. Слои

Импортировать можно **только из слоёв строго ниже**:

```
app → pages → widgets → features → entities → shared
```

| Слой | Назначение |
|---|---|
| `app` | Сборка приложения: провайдеры (Query, Lingui, Effector), роутер и файлы маршрутов, серверные точки входа Start, глобальные стили, глобальные модели (`app/model`, `app/ui`) |
| `pages` | Экран приложения (каталог, карточка товара, лендинг, экраны админки). Большой экран собирается из виджетов |
| `widgets` | Композиция фич и сущностей в блок, который встраивается в экраны (шапка магазина, сетка каталога, шторка корзины) |
| `features` | Пользовательские сценарии и функциональность (фильтры, добавление в корзину, заказ через WhatsApp, поиск) |
| `entities` | Модели, нужные двум и более фичам (магазин, товар, корзина) |
| `shared` | Универсальный код без бизнес-контекста: ui-kit, хелперы, типы, настройка api-клиента, константы, i18n |

### Запрещено
- Импорт «вверх» по слоям (`shared` → `features`).
- Импорт между срезами **одного слоя**: widget → widget, feature → feature, entity → entity, page → page.
- Если фиче нужна модель другой фичи — **вынести модель в `entities`**. Если двум сущностям нужна общая модель — **вынести её в `shared`**.

### Что лежит вне `src`
- `@catalog/ui` (`packages/ui`) — токены и базовые компоненты дизайн-системы. Для FSD это часть `shared`: импортировать можно из любого слоя. Доменных компонентов там нет. В `shared/ui` приложения — только то, что нужно одному приложению.
- `@catalog/contract` — сгенерированные типы, SDK, хуки Query, схемы Zod, моки. Тоже часть `shared`; импортируется напрямую, запросы вручную не пишем (см. `api/` ниже).

### Файлы маршрутов (TanStack Start / Router)
Файловый роутер требует каталог маршрутов, поэтому `src/routes/` принадлежит слою `app`. Файл маршрута тонкий: путь, `validateSearch`, `loader` (предзагрузка Query), `head`/SEO и подключение компонента из `pages`. Разметки и бизнес-логики в нём нет. Серверная логика Start (request middleware, определение магазина по поддомену) — тоже в `app`.

Точки входа Start лежат в `app` и подключены в `vite.config.ts`: `app/router.tsx` (роутер и QueryClient на каждый запрос), `app/client.tsx`, `app/server.ts`; маршруты — `app/routes`, дерево маршрутов `app/routeTree.gen.ts` генерирует Start и хранится в git. Моки API (MSW, только в разработке) — `app/mocks`. Определение магазина по `Host` (лендинг / витрина / чужой адрес) — `app/lib` (`getTenant`), результат лежит в контексте роутера как `tenant`.

Локализация (Lingui, T-103): `app/i18n` создаёт свой экземпляр `i18n` на каждый запрос, роутер оборачивает приложение в `I18nProvider` (`Wrap` в `app/router.tsx`). Каталог витрины — `app/i18n/locales/{locale}.po`, строки `@catalog/ui` подгружаются из его каталога. Строки пишем макросами `Trans` / `useLingui` в `ui/` и `hooks/`.

> Примечание (2026-11-01, T-103): срезам одного слоя нельзя импортировать друг друга, поэтому виджеты шапки и «О магазине» не знают друг о друге: состояние «шторка открыта» держит страница (`pages/catalog`) и передаёт им пропсами. Общие для виджетов вещи (аватар магазина, «Открыто до…», график, ссылки WhatsApp/2ГИС) лежат в `entities/shop`; общая иконка — `shared/ui/icon`.

> Примечание (2026-11-01, T-106): корзина — `entities/cart` на Effector, глобальные сторы без `fork`. Это допустимо, потому что на сервере событий корзины нет (их вызывает только браузер), а хранилище `localStorage` читается после гидратации событием `cartMounted` из корневого маршрута — иначе разметка сервера и браузера разошлась бы. Тесты модели идут через `fork()`. Карточка товара — отдельный маршрут `app/routes/$product.tsx` (страница `pages/product`), а не окно поверх каталога: окно на компьютере (S8) — T-109.

> Примечание (2026-11-01, T-109): окно товара на компьютере (S8) — не отдельный компонент, а те же `widgets/product-view` с классами `lg:`; страница каталога не читает маршрут сама, а получает `search` и `onSearchChange` пропсами, поэтому маршрут товара (`app/routes/$product.tsx`, он тоже принимает выбор каталога в адресе) рисует её под окном: страницы друг друга не импортируют, собирает их слой `app`. Размер экрана для логики — `useIsDesktop` из `shared/hooks` (на сервере всегда «телефон», компьютерное дорисовывается после гидратации). Разбор адреса каталога (`validateCatalogSearch`, `toProductParams`) лежит в `entities/product`, потому что нужен и каталогу, и карточке.

> Примечание (2026-11-01, T-108): `features/order-via-whatsapp` зависит от `entities/cart` (очищает корзину событием `cartCleared`) и показывает экран «Отправлено» вместо корзины через собственный стор `$sentOrder`; шторка корзины после оформления остаётся открытой (`$open` не сбрасывается при очистке), а закрытие шторки сбрасывает экран. Событие `order_click` отправляется из эффекта фичи.

> Примечание (2026-11-01, T-107): шторка корзины (`widgets/cart-sheet`) открывается и из каталога, и с карточки товара, поэтому рендерится один раз в корне приложения (`app/routes/__root.tsx`), а открывается событием `cartOpened(поддомен)` из `entities/cart`; плашка `widgets/cart-pill` — только на странице каталога. Перепроверка цен и наличия — эффект модели корзины, результат применяется к корзине на момент ответа.

> Примечание (2026-11-01, T-105): в `shared` появился сегмент `hooks` (общие React-хуки без бизнес-контекста, например `useSheetPlacement` — шторка снизу на телефоне и окно по центру на компьютере); импортируется через индекс (`@/shared/hooks`). Поправка (2026-11-02): `useSheetPlacement` удалён при сверке с макетами (T-114), размещение шторки выбирает сам виджет через `useIsDesktop`. Поиск и фильтры — отдельные срезы `features/product-search` и `features/product-filters`, друг о друге не знают: их связывает страница `pages/catalog`, а выбор хранится в адресе.

> Примечание (2026-11-02, T-111–T-113, E2): превью и события — в `shared/api` (`preview.ts`: токен из адреса и перехватчик SDK; `track-event.ts`); адрес сайта и теги страницы — `shared/lib` (`site-origin.ts`, `page-head.ts`, `service-urls.ts`); просмотры — `features/track-view`, правки из админки в превью — `features/shop-draft`; `sitemap.xml` и `robots.txt` — файлы маршрутов в `app/routes`, сборка карты — `app/lib/sitemap.ts`; заголовки страниц собирают загрузчики (`pages/*/api/*-head.ts`). Лендинг — `pages/landing` (секции в `ui/`, логика примера — `lib/demo-order.ts`). Корзина помнит последнюю убранную позицию для «Вернуть» (`$removed`, `itemRestored` в `entities/cart`).

> Примечание (2026-11-02, T-301, с согласия основателя): иконки (`Icon`) и `useIsDesktop` нужны и витрине, и админке, поэтому переехали в `@catalog/ui`; сегмент `shared/hooks` витрины удалён, `shared/ui/icon` — тоже. Упоминания `shared/hooks` и `shared/ui/icon` в примечаниях выше относятся к прошлому устройству.

> Примечание (2026-11-02, T-301): админка (`apps/admin`) — SPA на Vite + TanStack Router без Start. Точка входа — `app/main.tsx` (сначала моки, потом `RouterProvider`), роутер, QueryClient и Lingui — `app/router.tsx`; маршруты файловые — `app/routes` (плагин `@tanstack/router-plugin`), дерево `app/routeTree.gen.ts` генерирует плагин и хранится в git. Рабочие разделы лежат под макетом `app/routes/_shell.tsx` (загрузчик магазина и счётчиков, оболочка `widgets/app-shell`); вход и мастер (T-302, T-303) будут вне его. Моки — `app/mocks` (`demoAdminHandlers` из `@catalog/contract/msw`). Запросы идут с cookie (`credentials: 'include'`, `shared/api`).

> Примечание (2026-11-02, T-305): «Товары» админки — страница `pages/products` (выбор в адресе: `?q=&filter=&category=`, разбор — `pages/products/lib`), виджет `widgets/product-list` (список на телефоне, таблица на компьютере, выбор строк), фичи `features/product-search`, `features/toggle-product-visibility` (переключатель «Витрина» сразу, без ожидания ответа), `features/bulk-edit-products` (полоса массовых действий); сущности `entities/product` (список по курсору, `invalidateProducts`, `ProductThumb`) и `entities/category`. `formatPrice` и `useLoadMore` нужны обоим приложениям и переехали в `@catalog/ui`; `useLoadMore` теперь отдаёт ref-колбэк (маркер может смениться после `useIsDesktop`). Выбор строк держит страница: на телефоне он меняет её шапку («Выбрано N») и закрывает меню панелью действий (`PhoneBulkBar`); само действие и текст сообщения — хук `useBulkProducts` фичи, сообщение показывает страница (`shared/ui/toast`).

> Примечание (2026-11-05, T-306): редактор товара — фича `features/product-form` (форма `useProductForm`, чистые функции в `lib/product-draft.ts`, сохранение `useSaveProduct` / `useCreateProduct`, части формы в `ui/`); экраны `pages/product` (`/products/$productId`) и `pages/new-product` выбирают раскладку телефона или компьютера через `useIsDesktop` — макеты у них разные, а не одни и те же блоки с `lg:`. Свойства магазина — `entities/attribute`, товар в кеш после сохранения — `applyProduct` из `entities/product`.

> Примечание (2026-11-08, T-315): выпадающие списки — `Select` из `@catalog/ui` (не `shared/ui` админки: без бизнес-контекста, пригодится витрине). Порядок таблицы товаров — `widgets/product-list` (`lib/table-sort.ts`, `ui/sort-header`), подписи порядков — `useSortLabels` в `entities/product/hooks`; страница передаёт `onSortChange`. В `shared/hooks` — `useCopied`. `BackBar` принимает `returnBack` (назад по истории, `useCanGoBack`). У пункта меню может быть `deskTo` — свой адрес на компьютере («Магазин» → `/shop/info`).

> Примечание (2026-11-08, T-314): после UX-аудита меню — «Главная / Товары / Магазин» (`widgets/app-shell/constants/nav-items.ts`, у пункта — `match`: какие адреса относятся к разделу). Статистика переехала в `pages/stats` (`/stats`), аккаунт — в `pages/account` (`/account`); «Магазин» — маршрут-обёртка `app/routes/_shell/shop.tsx` с `widgets/shop-settings-layout` и дочерними `shop.index`, `shop.info`, `shop.categories`, `shop.stock`. Токен превью — `entities/shop/api/preview-token.ts` (раньше в `features/storefront-preview`). Шторка с формой внутри другой формы — через `createPortal` в `body` (`widgets/category-field`).

> Примечание (2026-11-08, T-313): «Статистика» — только страница `pages/shop-stats` (с T-314 — `pages/stats`) (действий нет, период — в адресе): график и изменение к прошлому периоду — `lib/stats.ts`, `ui/views-chart`, `ui/top-products`. Заглушка `pages/shop-soon` удалена.

> Примечание (2026-11-08, T-312): «Наличие на витрине» — страница `pages/shop-stock` и фича `features/edit-stock-display` (`useStockSettings`: правка сразу в кеш магазина и `PATCH /shop`, порог — с паузой и сохранением при уходе).

> Примечание (2026-11-08, T-311): «Категории и размеры» — страница `pages/shop-categories` из двух фич: `features/manage-categories` (список с перетаскиванием на dnd-kit — `group`/`type`/`accept` по уровню, шторка категории, удаление) и `features/manage-attributes` (карточки свойств, чипы значений, шторки свойства и значения). Порядок и перенос категорий (группы → тело `PUT /categories/order`) — `entities/category/lib/category-order.ts`, диапазон значений — `entities/attribute/lib/values-range.ts`.

> Примечание (2026-11-05, T-307): фото товара — фича `features/product-photos`: хуки `useProductPhotos` (карточка: сразу на сервер, опрос, пока `processing`) и `useNewProductPhotos` (новый товар: `uploadIds()` для `createProduct`) отдают одинаковый `PhotoList`, его рисуют `PhotoStrip` (телефон) и `PhotoPanel` (компьютер); перетаскивание — `ui/sortable-photos` на dnd-kit. Страницы `pages/product` и `pages/new-product` связывают её с `features/product-form`. Загрузка файла в хранилище (API2) — `uploadFile` из `shared/api`, им же грузится логотип.

> Примечание (2026-11-05, ADR 0003): формы админки — TanStack Form через общую обвязку `shared/ui/app-form` (`useAppForm`, `field.TextField`, `form.SubmitButton`, `form.FormServerError`, `submitForm`, `setServerError` / `setFormError`, `invalidFields`, `useIsDirty`); правила — в ADR 0003. Своих `useState` для значений и ошибок форм не заводим.

## 2. Структура среза (feature / widget / entity / page)

```
<slice>/
├── model/       # бизнес-логика, ТОЛЬКО Effector-часть (сторы, события, эффекты, sample)
├── api/         # запросы к бэкенду среза ({name}.api.ts): обёртки над SDK и Query
├── ui/          # React-компоненты
├── lib/         # хелперы и чистые функции среза
├── hooks/       # React-хуки среза (обвязка UI, без бизнес-логики)
├── constants/   # константы среза
├── types/       # типы среза ({name}.types.ts)
└── index.ts     # ТОЛЬКО публичные экспорты среза
```

Создаём только нужные папки.

- **Модель держит только Effector-часть.** Константы, типы, классы и чистые функции выносятся: функции и классы в `lib/`, константы в `constants/`, типы в `types/`. В файле модели остаются импорты, сторы, события, эффекты и `sample`.
- **Запросы к бэкенду лежат в `api/`**, а не в `lib/`: `api/{name}.api.ts` и `api/index.ts` с реэкспортом. Клиент и типы ответов берём из `@catalog/contract` (сгенерированный SDK), сами `fetch` не пишем. Здесь — `queryOptions` / ключи TanStack Query, нужные срезу, и обёртки над сгенерированными хуками, если нужна доработка. Серверное состояние живёт в Query, не в Effector (ADR 0001).
- **Файлы типов называются `{name}.types.ts`**, чтобы не путать с одноимёнными файлами в `lib/` и `model/`. Реэкспорты всех типов среза — в `types/index.ts`. Типы, которые уже есть в контракте, заново не описываем.
- **Тесты лежат в папке `__tests__/` рядом с тестируемым кодом**: `lib/__tests__/format-price.test.ts`, `model/__tests__/cart.model.test.ts`. Имя файла: `{тестируемый файл}.test.ts`.

## 3. Именование и экспорты

- Файлы и папки — `kebab-case`. Файлы моделей: `{name}.model.ts` (`cart.model.ts`, `product-filters.model.ts`). Файлы api: `{name}.api.ts`.
- В каждой папке модуля (`model/`, `ui/`, `lib/`, компонент и т. д.) есть `index.ts` с реэкспортами.
- `index.ts` содержит **только реэкспорты**. Реализации компонентов и бизнес-логика в них не размещаются.
- Исключения: `index.ts` не нужен у папки `model/` без публичного API (модель подключается ради побочных эффектов, например модель экрана — её импортирует её же `ui`). В `shared/constants`, `shared/types` лежат независимые файлы, общий индекс там не заводим. Ничего не экспортируем «на всякий случай» — только то, что используется.
- Модели: `$$xModel` (объект с публичным API), сторы `$x`, события — глаголы или прошедшее время, эффекты `xFx`.
- Публичный API среза — только то, что экспортируется из его корневого `index.ts`. Внешние слои импортируют **только** через него (`@/features/add-to-cart`), без глубоких путей.
- Строки интерфейса — через Lingui, в `ui/` и `hooks/`; в `model/`, `lib/`, `constants/` — только ключи или данные.

## 4. Декомпозиция компонентов в `ui/`

Компоненты **никогда не лежат плоско**. Если главный компонент разбит на части, каждая часть в своей папке:

```
ui/
├── order-form.tsx                  # главный компонент, использует submit-order
├── index.ts                        # export { OrderForm } from "./order-form"
└── submit-order/
    ├── submit-order.tsx
    └── index.ts                    # реэкспорт submit-order.tsx
```

Вложенность рекурсивна: у декомпозированной части своя папка с тем же устройством. В `shared/ui` каждый компонент — в своей папке (`shared/ui/chip/chip.tsx` + `index.ts`).

## 5. Импорты внутри одного среза

- Внутри среза импортируем **по конкретному сегменту** (`lib`, `hooks`, `constants`, `types`, `model`, `api`), **не через корневой `index.ts` среза** — иначе циклические зависимости.
  - ✅ `@/features/add-to-cart/api`
  - ✅ `@/features/product-filters/model`
  - ❌ `@/features/add-to-cart`
- Между слоями — через публичный `index.ts` нижележащего среза.

## 6. Алиас

- Алиас один: `@/*` → `src/*` (`@/shared/lib`, `@/features/add-to-cart`). Относительные пути только внутри одной папки (`./order-form`).
- `shared/types`, `shared/constants` импортируются по файлу (`@/shared/constants/breakpoints`), остальные сегменты `shared` — через индекс (`@/shared/api`, `@/shared/lib`, `@/shared/ui`).
- Пакеты монорепо — по имени: `@catalog/ui`, `@catalog/contract`.

## 7. Состояние и данные (как FSD сочетается со стеком)

- **Серверные данные** (товары, магазин, фасеты) — TanStack Query; запросы и ключи в `api/` среза, предзагрузка — в `loader` маршрута (слой `app`).
- **Клиентская логика** (корзина, шторки) — Effector в `model/`; корзина — `entities/cart`, потому что нужна и карточке товара, и плашке, и шторке корзины.
- **Фильтры, категории, сортировка** — search params роутера, не Effector (ADR 0001, FR-V4). В срезе `product-filters` лежат разбор и сборка параметров (`lib/`) и UI.
- **SSR:** глобальных сторов на сервере нет — либо только клиент, либо `fork`-scope на запрос (ADR 0001).

## 8. Разметка слоёв витрины (по состоянию на T-110)

Ориентир, не жёсткая схема; новые срезы добавляем по ходу работы и обновляем таблицу.

| Слой | Срезы |
|---|---|
| `entities` | `shop` (магазин, «открыто до…», график, ссылки WhatsApp/2ГИС), `category` (дерево, путь до категории), `product` (плитка в сетке, цена, выбор варианта, адрес товара, разбор адреса каталога), `cart` (позиции, хранение на устройстве, перепроверка) |
| `features` | `product-search`, `product-filters`, `catalog-sort`, `add-to-cart`, `order-via-whatsapp`, `ask-in-whatsapp` (ссылка на чат с готовым текстом, S9) |
| `widgets` | `shop-header`, `about-shop-sheet`, `category-bar`, `catalog-grid`, `product-view`, `cart-pill`, `cart-sheet` |
| `pages` | `catalog`, `product`, `landing`, `not-found`, `error`, `shop-unavailable` |

### Админка (по состоянию на T-315)

| Слой | Срезы |
|---|---|
| `entities` | `session` (текущий аккаунт, `meQueryOptions`, `startSession` — кеш после входа), `shop` (запрос магазина, аватар, статус витрины, адрес витрины; `StorefrontLink` — ссылка на витрину, до публикации с токеном превью; `publishBlockers`, `whatsappShareUrl`), `product` (счётчики товаров), `attribute` (свойства со значениями — размеры в редакторе, диапазон значений), `category` (дерево, плоский список, порядок и перенос — `lib/category-order.ts`), `import` |
| `features` | `copy-link` (скопировать ссылку с галочкой), `register`, `login`, `forgot-password`, `reset-password`, `change-password` (формы входа и пароля), `resend-verification` (повторное письмо: кнопка и ссылка), `setup-name`, `setup-address`, `setup-whatsapp`, `setup-logo` (шаги мастера), `publish-shop` («Опубликовать витрину» со всеми причинами, если нельзя; шторка «Витрина опубликована»; «Снять»), `product-form` (редактор товара: черновик, проверка, сохранение, поля, таблицы размеров), `product-photos`, `edit-shop-info` («О магазине»), `manage-categories`, `manage-attributes` (категории и свойства, T-311), `edit-stock-display` (наличие на витрине, T-312) и др. — подробности в примечаниях выше |
| `widgets` | `app-shell` (меню снизу / слева — адреса и выделение разделов в `hooks/use-nav-sections.ts`, шапка телефона, «Ваша витрина»), `auth-layout` (экраны без меню: форма слева, сиреневая колонка справа на компьютере), `setup-layout` (экран мастера: шаги, кнопки), `setup-preview` (живое превью витрины в мастере), `shop-settings-layout` (раздел «Магазин»: подменю настроек слева на компьютере, T-314), `category-field` (выбор категории в товаре с «+ Новая категория…» и «Настроить категории…», T-314) |
| `pages` | `home` (главная: до публикации чек-лист — `lib/checklist.ts`, после — сводка и «Нужно сделать» — `lib/todos.ts`), `account` (аккаунт, T-314), `stats` (статистика главной, T-314), `setup`, `register`, `login`, `forgot-password`, `reset-password`, `verify-email`, `products`, `import`, `import-history`, `shop` (раздел «Магазин»), `shop-info`, `shop-categories`, `shop-stock` (T-310–T-312), `not-found`, `error`, `product` (карточка товара), `new-product`, `quick-photos` (быстрый режим «Добавить фото», T-308: очередь — `api/`, экран — `ui/`, сама доска фото — `QuickBoard` из `features/product-photos`) |

> Примечание (2026-11-02, T-302): разбор ошибок API (статус, код, ошибки полей, `isUnauthorized`) — `shared/api/api-error.ts`; рабочее название сервиса — `shared/constants/service.ts`. Проверка сессии — `beforeLoad` макета `app/routes/_shell.tsx` (401 → `/login`). Общие куски форм — `shared/ui` (`FormNote`, `FormFooter`, `FormError`, `PasswordNote`, `SendAgain`, `ButtonLink`, `BackBar`), проверки почты и пароля — `shared/lib/credentials.ts`, тексты ошибок форм — `shared/hooks/use-form-messages.ts`. Вложенный экран раздела (на телефоне без шапки и меню) помечается в маршруте `staticData: { subScreen: true }` (тип — `app/router.tsx`), его читает `widgets/app-shell`.

> Примечание (2026-11-02, T-303): картинки, нужные одному срезу, лежат в его сегменте `assets/` и импортируются как модули (`widgets/setup-preview/assets` — фото-пример для превью, 240 px). Магазин в кеш после сохранения — `applyShop` из `entities/shop` (перечитывает и `me`, даже без подписчиков: по нему маршруты решают, пройден ли мастер). Мастер — `app/routes/setup.tsx`, шаг в адресе (`?step=`); `_shell` ведёт в мастер, пока `setupCompleted` ложно.

## 9. Проверка правил

Линтер (`pnpm lint`) проверяет направление импортов между слоями, запрет импортов между срезами одного слоя, запрет глубоких путей (снаружи только `index.ts` среза и сегментов `shared`; `shared/constants` и `shared/types` — по файлу) и импорт среза через его же корневой `index.ts` по алиасу. Инструмент — `eslint-plugin-boundaries`, настройка — [`eslint.fsd.js`](../../eslint.fsd.js) (задача T-100), подключается к `apps/web` и `apps/admin`.

Не проверяется (остаётся на ревью): импорт своего корня через `..`, структура среза (модель только Effector, `api/`, `__tests__/`, `{name}.types.ts`, `index.ts` только с реэкспортами), именование.

Новый слой или сегмент `shared` — правим `eslint.fsd.js` вместе с этим документом.
