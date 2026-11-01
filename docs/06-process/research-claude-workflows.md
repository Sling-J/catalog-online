---
status: accepted
owner: founder
updated: 2026-10-31
---

# Исследование: как организуют разработку с Claude

Сводка публичных практик (официальная документация Anthropic, авторы популярных фреймворков, блоги разработчиков) на октябрь 2026. Интересует только организация работы, а не идеи проектов. Выводы для нас — в [workflow.md](workflow.md) и [roles.md](roles.md).

## 1. Что используют люди: основные подходы

### 1.1 Официальный цикл Anthropic: Explore → Plan → Code → Commit
- Сначала Claude изучает контекст в Plan mode (только чтение), потом пишет план (какие файлы, какой поток), человек правит план, затем реализация с проверкой (тесты, линтер, браузер), затем коммит/PR.
- План нужен для неочевидных и многофайловых изменений. Если изменение описывается одной фразой, план не нужен.
- Ключевое: **у Claude должен быть способ проверить себя** (тесты, сборка, браузер).

### 1.2 Борис Черни (руководитель Claude Code): как пользуется сам
- Plan mode, пока план не станет правильным, потом авто-применение правок: реализация часто с первого раза.
- **CLAUDE.md короткий** (~100 строк). Новые уроки добавляются в него по ходу ревью («compounding engineering»: каждая ошибка один раз становится правилом).
- Claude сам проверяет UI в браузере и итерирует, пока не заработает. Хуки форматирования после правок.
- Несколько параллельных сессий на независимые задачи.

### 1.3 Harper Reed: spec → plan → execute
- Сначала «выжимание идеи» в диалоге: модель задаёт по одному вопросу, итог сохраняется в `spec.md`.
- Сильная модель превращает спеку в пошаговый план (`prompt_plan.md`) и чек-лист (`todo.md`), который отмечается по ходу. Это сохраняет состояние между сессиями.
- Простой, переносимый, без фреймворков.

### 1.4 Spec-driven development (GitHub Spec Kit и аналоги)
- Четыре фазы с воротами: Specify (цели, пользовательские сценарии) → Plan (архитектура, ограничения) → Tasks (мелкие проверяемые задачи) → Implement.
- Человек ревьюит артефакт каждой фазы до перехода к следующей.

### 1.5 Superpowers (Jesse Vincent)
- Скиллы: brainstorm (сократический диалог → дизайн-документ) → write-plan (мелкие задачи с путями файлов) → execute-plan (свежий субагент на задачу + ревьюер, сверяющий результат с планом, TDD).
- Сильная сторона: дисциплина и ревью между задачами. Слабая: универсальность, тяжёлый ритуал на мелочи, конфликты с встроенным Plan mode.

### 1.6 BMAD Method
- Agile-роли как агенты: Analyst (бриф) → PM (PRD, эпики, стории) → Architect (архитектура) → Scrum Master → Dev → QA. Каждый агент в новом чате, передача через документы.
- Сильная сторона: полный набор документов. Слабая: много церемоний, рассчитан скорее на команду/корпоративный процесс, у соло-разработчика превращается в бюрократию.

### 1.7 Дизайн с ИИ
- Популярная связка: дизайн-скилл (Impeccable, бывший frontend-design) + файлы `DESIGN.md` / `PRODUCT.md`, чтобы агент держался одной дизайн-системы, а не выдавал «усреднённый ИИ-стиль».
- Практика: сначала широкое исследование направлений (несколько вариантов), потом фиксация стиля и дизайн-системы, потом все экраны внутри неё.
- Предупреждение авторов: сгенерированная дизайн-система без сильного брифа и критического ревью даёт «средние варианты быстрее». Нужен человек-арбитр.

### 1.8 Фронт до бэка: contract-first
- Сначала контракт API (OpenAPI/общие типы), фронт пишется против мок-сервера (MSW, Prism), бэк реализует тот же контракт, контрактные тесты проверяют, что мок совпадает с реальностью.

## 2. Механизмы Claude Code и когда что применять

| Механизм | Что это | Когда использовать |
|---|---|---|
| `CLAUDE.md` | Всегда загружаемые правила проекта | Стандарты, команды сборки/тестов, карта docs. Коротко (<200 строк) |
| Skill / slash-команда | Инструкция, загружаемая по требованию в текущий диалог | Повторяющийся процесс проекта (написать ADR, оформить фичу) |
| Субагент | Отдельный контекст, возвращает только итог | Объёмное чтение/поиск/ревью, чтобы не засорять основной контекст |
| Hook | Детерминированный скрипт на событие | То, что должно выполняться всегда (формат, линт, запреты) |
| Plugin | Упаковка skills/agents/hooks для распространения | Делиться с другими. Для одного проекта не нужно |
| Plan mode | Режим только чтения + план | Перед неочевидной/многофайловой задачей |

## 3. Опыт сообщества про агентов (важно для нас)

- **Больше агентов — хуже.** Автор, создавший 100 субагентов, оставил 12. Пересекающиеся описания путают маршрутизацию, Claude выбирает не того или никого.
- **Авто-делегирование ненадёжно:** часто приходится явно говорить «используй ревьюера».
- **Дробление процесса на 8–9 агентов** заставляет координатора тратить больше, чем экономится.
- **Субагенты стартуют с нуля:** не видят диалог, всё нужно передать в задаче. Хорошо работают на задачах с объёмным чтением (поиск, исследование, ревью), хуже на параллельном написании кода.
- Субагенты можно пускать на более дешёвой модели, основная сессия на сильной.

## 4. Выводы для catalog-online

1. **Берём каркас spec → plan → tasks → implement с воротами,** но без тяжёлого фреймворка: свои шаблоны документов в `docs/`.
2. **Роли — это «шляпы» и шаблоны документов, а не отдельные агенты.** Человек + основная сессия Claude работают в паре, Claude спрашивает на развилках.
3. **Субагенты — только 2–3 узких** (исследование, ревью против спеки, позже QA в браузере), и только когда реально нужны.
4. **Свои skills создаём по факту:** когда одно и то же действие повторилось 2–3 раза.
5. **Короткий CLAUDE.md + файл текущего статуса,** чтобы любая новая сессия знала, где мы.
6. **Контракт API до фронта,** фронт на моках. Это сохраняет желаемый порядок «сначала фронт», но не ломает бэк потом.
7. **Проверка в цикле:** тесты, сборка, браузер. Без этого «готово» не считается.
8. **Блокеры не останавливают работу:** записываем в open-questions и идём дальше.

## Источники

- [Claude Code: Best practices (официальная документация)](https://code.claude.com/docs/en/best-practices)
- [Anthropic Engineering: Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [How and when to use subagents in Claude Code (Anthropic)](https://claude.com/resources/articles/subagents-in-claude-code)
- [InfoQ: workflow создателя Claude Code](https://infoq.com/news/2026/01/claude-code-creator-workflow/)
- [How Boris Cherny uses Claude Code](https://karozieminski.substack.com/p/boris-cherny-claude-code-workflow)
- [Harper Reed: My LLM codegen workflow atm](https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/) и [комментарий Simon Willison](https://simonwillison.net/2025/Feb/21/my-llm-codegen-workflow-atm/)
- [DataCamp: Spec-Driven Development with Claude Code](https://www.datacamp.com/tutorial/spec-driven-development-with-claude-code)
- [DataCamp: Claude Code best practices](https://www.datacamp.com/tutorial/claude-code-best-practices)
- [Augment: Claude Code for spec-driven development](https://www.augmentcode.com/guides/claude-code-spec-driven-development)
- [Visual Studio Magazine: GitHub Spec Kit](https://visualstudiomagazine.com/articles/2025/09/03/github-open-sources-kit-for-spec-driven-ai-development.aspx)
- [DataCamp: Superpowers](https://www.datacamp.com/tutorial/claude-code-superpowers), [Developers Digest: Superpowers guide](https://www.developersdigest.tech/blog/claude-code-superpowers-plugin-guide)
- [BMAD: agile roles as agents](https://developertoolkit.ai/en/ecosystem/frameworks/bmad-method/), [BMAD vs Spec Kit](https://medium.com/@visrow/a-tale-of-two-frameworks-bmad-method-vs-github-spec-kit-c021ab0ad037)
- [DEV: I built 100 subagents, 12 earn their context](https://dev.to/suraj_khaitan_f893c243958/i-built-100-claude-code-subagents-these-are-the-12-that-actually-earn-their-context-10nn)
- [Claude subagents + skills: 40 deployments of lessons](https://autoolize.com/blog/claude-subagents-and-skills-lessons/)
- [ksred: what subagents actually unlock](https://www.ksred.com/claude-code-agents-and-subagents-what-they-actually-unlock/)
- [Skills vs subagents vs hooks (Towards AI)](https://pub.towardsai.net/claude-code-skills-vs-subagents-vs-hooks-vs-workflows-which-to-use-in-2026-120db6ae5b3c), [chudi.dev](https://chudi.dev/blog/claude-code-skills-vs-subagents)
- [Impeccable skill guide](https://www.uwarp.design/blog/impeccable-skill-frontend-design-guide), [Composio: top design skills](https://composio.dev/content/top-design-skills)
- [UX Planet: AI and design system](https://uxplanet.org/ai-and-design-system-3dab36a5cc50)
- [Contract-first API skill](https://openskillindex.com/skills/sah1l-awesome-claude-code-contract-first-api), [Mocking APIs skill](https://smithery.ai/skills/jeremylongshore/mocking-apis)
- [PhotoStructure: curated notes vs compaction](https://photostructure.com/coding/claude-code-tpp/)
