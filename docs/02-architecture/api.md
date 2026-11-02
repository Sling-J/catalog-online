---
status: accepted
owner: founder
updated: 2026-11-02
---

# Контракт API: соглашения

Сам контракт — [`packages/contract/openapi.yaml`](../../packages/contract/openapi.yaml) (OpenAPI 3.1), источник правды ([ADR 0001](adr/0001-stack.md)). Из него Hey API генерирует код для фронтов и бэка. Линтер: `npx @redocly/cli lint` в `packages/contract` (правила — `redocly.yaml`).

## Решения (2026-11-01)
| # | Вопрос | Решение |
|---|---|---|
| API1 | Разделение | Два префикса: `/v1/storefront/{subdomain}/…` — публично, без входа; `/v1/admin/…` — только с сессией, магазин берётся из сессии, не из адреса. Плюс `/v1/auth/…` и `/v1/staff/…` |
| API2 | Загрузка файлов | Напрямую в хранилище: `POST /v1/admin/uploads` даёт короткоживущую ссылку → файл уходит `PUT` в S3/MinIO → `uploadId` передаётся в нужный запрос (фото, логотип, импорт) |
| API3 | Длинные списки | Курсор: `?cursor=…&limit=…` → `{ items, nextCursor }`, `nextCursor: null` — конец |
| API4 | Ошибки | RFC 9457 `application/problem+json` с машинным `code` и ошибками по полям `errors[]`; текст показывает фронт через Lingui по коду |

## Прочие соглашения
- **Версия** в пути: `/v1`. Ломающие изменения — `/v2`, старое живёт, пока фронты не переедут.
- **Имена** полей — camelCase; `operationId` — глагол + сущность (`listProducts`), из них генерируются имена хуков.
- **Деньги** — целые тенге. **Время** — ISO 8601 UTC. **Id** — UUID v7. Товар на витрине ищется по `shortId`.
- **Частичное обновление** — `PATCH` с переданными полями. **Таблицы целиком** (варианты, значения свойств, порядок категорий и фото) — `PUT` полным списком: так устроены редакторы в админке.
- **Фоновые операции** (импорт, сжатие фото) отвечают `202` / статусом в объекте; фронт опрашивает `GET`.
- **Вход:** cookie `sid` (HttpOnly, Secure, SameSite=Lax, родительский домен). Изменяющие запросы обязаны слать заголовок `X-Requested-With` — простая защита от CSRF. Суперадминка — отдельный cookie `staff_sid`.
- **Ограничение частоты** на вход, регистрацию, письма и события витрины — ответ `429` с `Retry-After`.
- **Ссылки из писем** (2026-11-02, T-302): ведут в админку — подтверждение почты `https://app.<домен>/verify-email?token=…` (→ `POST /v1/auth/email/verify`), новый пароль `https://app.<домен>/reset-password?token=…` (→ `POST /v1/auth/password/reset`). Устаревший токен — `410 token_expired`, админка показывает «Ссылка устарела».
- **Превью неопубликованной витрины** (A7): `POST /v1/admin/preview-token` → токен в `?preview=` у запросов витрины.
  > Примечание (2026-11-02, T-113): несохранённые правки админка передаёт витрине через `postMessage`; формат сообщений — `packages/contract/src/preview.ts` (`@catalog/contract/preview`), описание — `04-design/storefront.md`, «Превью из админки». `PreviewToken` добавлен и в `checkStorefrontCart`.

## Где что на экранах
| Экран | Запросы |
|---|---|
| Витрина: шапка, «О магазине» | `getStorefrontShop` |
| Витрина: категории, сетка, фильтры | `listStorefrontCategories`, `listStorefrontProducts`, `getStorefrontFacets` |
| Карточка товара, «Закончился» + «Ещё в этой категории» | `getStorefrontProduct`, `listStorefrontProducts?categoryId=` |
| Корзина: «цены и наличие изменились» | `checkStorefrontCart` |
| Статистика витрины | `trackStorefrontEvent` (`view`, `order_click`) |
| Регистрация, вход, письма, пароль | `/v1/auth/*` |
| Мастер 1–4, «О магазине», «Наличие на витрине», публикация, чек-лист | `getShop` (+ `readiness`), `updateShop`, `checkSubdomain`, `setShopLogo`, `publishShop` |
| Товары, вкладки, баннер «без фото», массовые действия | `listProducts`, `getProductCounts`, `bulkUpdateProducts` |
| Карточка / новый товар, размеры, фото | `getProduct`, `createProduct`, `updateProduct`, `replaceProductVariants`, `addProductPhoto`, `reorderProductPhotos` |
| Быстрый режим «Добавить фото» | `listProducts?filter=no_photo` + `addProductPhoto` |
| Категории и свойства | `/v1/admin/categories/*`, `/v1/admin/attributes/*` |
| Импорт: файл → колонки → проверка → готово | `createUpload` → `createImport` → `setImportMapping` → `getImport` / `listImportErrors` → `applyImport` |
| Статистика | `getStats` |
| Суперадминка | `/v1/staff/*` |
