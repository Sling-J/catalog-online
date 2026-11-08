# 02-architecture: архитектура

Как устроена система и код. Решения — в ADR, чтобы помнить «почему».

| Файл | Что внутри |
|---|---|
| [adr/](adr/README.md) | Журнал архитектурных решений (стек, структура фронта и бэка, формы) |
| [data-model.md](data-model.md) | Модель данных: магазин, доступ, каталог, импорт, статистика; правила мультиарендности. Заказов нет (D14) |
| [api.md](api.md) | Соглашения контракта API и какие запросы на каких экранах. Сам контракт — `packages/contract/openapi.yaml` |
| [frontend-structure.md](frontend-structure.md) | Структура кода фронтов: Feature-Sliced Design ([ADR 0002](adr/0002-frontend-fsd.md)) |
| [backend-structure.md](backend-structure.md) | Структура кода бэкенда: модули Nest, слои, изоляция магазинов, ошибки, транзакции, тесты ([ADR 0004](adr/0004-backend-structure.md)) |

Отдельных документов нет, потому что тема уже описана в другом месте:
- изоляция магазинов — [data-model.md](data-model.md) («Общие правила») и [backend-structure.md](backend-structure.md) (раздел 6);
- нефункциональные требования — [../01-product/requirements.md](../01-product/requirements.md) (NFR);
- обзор системы — [adr/0001-stack.md](adr/0001-stack.md).

Позже, когда понадобится: как данные из интеграций попадают в каталог (вне MVP), runbook для эксплуатации (E6).

Интеграции с учётными системами: [../03-integrations/](../03-integrations/README.md).
