# Текущий статус

Обновляется в конце каждой рабочей сессии. Стадии описаны в [06-process/workflow.md](06-process/workflow.md).

**Стадия:** 5 — разработка, эпик E0 «Фундамент». Стадии 3 и 4 закрыты.
**Обновлено:** 2026-11-01

## Сделано
- Идея и её оценка (`00-vision/`).
- Структура документации.
- Процесс и роли приняты (`06-process/`).
- Стадия 1 закрыта: MVP, сценарии и ТЗ приняты (`01-product/`). Позже добавлено D14: заказы в админке не храним.
- Context7 MCP подключён и проверен.
- Скилл Impeccable установлен в проект; в MVP добавлен лендинг сервиса (D13).
- `PRODUCT.md` (корень) создан через `/impeccable init`: контекст продукта для дизайна.
- Стадия 2 закрыта:
  - лендинг N (1440 / 834 / 390), цвета AA, демо под D14 (`04-design/README.md`);
  - дизайн-система «Магазин в кармане»: `DESIGN.md` + `.impeccable/design.json`;
  - витрина V6 (`04-design/storefront.md`, S1–S11);
  - админка без заказов (`04-design/admin.md`, A1–A8);
  - холст: «Утверждено» / «На проверке» / «Архив».
- Стадия 3 закрыта:
  - стек — `02-architecture/adr/0001-stack.md`: pnpm + Turborepo; `web` на TanStack Start, `admin` на Vite + TanStack Router; TanStack Query, Effector, Lingui; `api` на NestJS + PostgreSQL/Drizzle; генерация из контракта — Hey API; Docker на VPS;
  - модель данных — `02-architecture/data-model.md` (DM1–DM4);
  - контракт API — `packages/contract/openapi.yaml` (линтер Redocly, `redocly.yaml`) и соглашения `02-architecture/api.md` (API1–API4).

## Следующий шаг
1. План принят: `05-tasks/roadmap.md` (E0–E7), `05-tasks/backlog.md`. T-001 готова (git, .gitignore, .editorconfig, .gitattributes, README). Следующая — T-002: монорепо pnpm + Turborepo.
2. Открыто: закон РК о хранении персональных данных → выбор хостинга (КЗ или за рубежом), отдельный ADR. Не блокирует разработку.
3. Позже: заказ 3D-иллюстраций вместо CSS-заглушек.

## В работе / заблокировано
- нет
