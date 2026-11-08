# Документация catalog-online

Единая точка входа: карта документации и как её читать. Как вести — [06-process/documentation-rules.md](06-process/documentation-rules.md).

## С чего начать

1. [status.md](status.md) — где проект сейчас и что дальше. Что уже сделано — [changelog.md](changelog.md).
2. [00-vision/idea.md](00-vision/idea.md) — что за продукт и зачем; риски — [00-vision/idea-evaluation.md](00-vision/idea-evaluation.md).
3. [06-process/workflow.md](06-process/workflow.md) — как мы работаем, стадии.
4. [open-questions.md](open-questions.md) — что ещё не решено; [ideas.md](ideas.md) — идеи по интерфейсу, которых нет в макетах (сначала макет, потом код).
5. [glossary.md](glossary.md) — термины.
6. Корень репозитория: [PRODUCT.md](../PRODUCT.md) (контекст продукта для дизайна), [DESIGN.md](../DESIGN.md) (дизайн-система), [README.md](../README.md) (устройство кода и команды), [CLAUDE.md](../CLAUDE.md) (правила для агента).

## Карта

| Раздел | Что внутри |
|---|---|
| [00-vision](00-vision/README.md) | Идея и её оценка |
| [01-product](01-product/README.md) | Объём MVP, сценарии, требования (ТЗ) |
| [02-architecture](02-architecture/README.md) | Архитектура, модель данных, соглашения API, структура кода фронта и бэка, ADR |
| [03-integrations](03-integrations/README.md) | Интеграции с учётными системами — вне MVP, только принципы |
| [04-design](04-design/README.md) | Экраны и решения витрины и админки, ссылка на холст с макетами |
| [05-tasks](05-tasks/README.md) | Роадмап (эпики E0–E7) и бэклог задач |
| [06-process](06-process/README.md) | Как работаем: стадии, роли, правила документов, грабли |

Где проект сейчас — только в [status.md](status.md); в оглавлениях состояние не дублируем.

**Номера разделов** задают порядок чтения: от «зачем» (00) через «что» (01) и «как» (02–04) к «когда» (05) и «как работаем» (06). Это не порядок, в котором шла работа: по [workflow.md](06-process/workflow.md) дизайн (стадия 2) шёл раньше архитектуры (стадия 3). Номера нужны и для того, чтобы папки стояли в этом порядке, а не по алфавиту.

## Как читать

- **Новый человек:** status → vision → product → open-questions.
- **Разработчик фронта:** status → [frontend-structure.md](02-architecture/frontend-structure.md) → [04-design](04-design/README.md) нужного экрана → [pitfalls.md](06-process/pitfalls.md) → задача в [backlog.md](05-tasks/backlog.md).
- **Разработчик бэка:** status → [backend-structure.md](02-architecture/backend-structure.md) → [data-model.md](02-architecture/data-model.md), [api.md](02-architecture/api.md) и контракт → [pitfalls.md](06-process/pitfalls.md) → задача в [backlog.md](05-tasks/backlog.md).
- **Дизайнер:** vision → product (сценарии) → [DESIGN.md](../DESIGN.md) → design.
