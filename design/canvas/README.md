# Макеты: копия холста Design

Холст на claude.ai — для просмотра глазами: https://claude.ai/artifact/Q9djVhqdPdb7CjTRvZcrnN.
Эта папка — **источник для кода**: те же макеты в репозитории, доступные любой сессии и любому разработчику без доступа к claude.ai.

Правило: изменили макет на холсте — в том же коммите обновили копию здесь (и наоборот). Копия снята с версии холста от 2026-11-02 (версия 80: колонка меню с черновиком, состояния мастера).

## Что где
- `boards/*.dc.html` — артборды. HTML + встроенный CSS + логика в `class Component extends DCLogic` (`renderVals()` отдаёт данные в шаблон, `{{…}}` — подстановки, `<sc-for>` / `<sc-if>` — циклы и условия). Это формат холста; файлы читаются как обычная вёрстка, но вне холста не запускаются (нужен его рантайм `support.js`).
- `canvas.json` — раскладка холста: какие артборды где лежат, их размеры, заголовки и заметки.
- `generators/*.cjs` — скрипты, которыми собраны экраны админки и служебных состояний витрины. Править их, а не результат: `node generators/gen-admin-phone.cjs boards/AdminPhone.dc.html`. Общие токены и куски — `admin-common.cjs`.
  > Примечание (2026-11-02): `gen-admin-phone.cjs` и `gen-admin-desk.cjs` отстали от холста — в них ещё экраны «Заказы», а `AdminPhone` / `AdminDesk` правили прямо на холсте. Источник правды для этих двух артбордов — файлы в `boards/`; генераторы не запускать, пока не приведены к ним.

## Утверждённые макеты (по ним делаем продукт)
| Файл | Что это | Описание |
|---|---|---|
| `Duo.dc.html`, `DuoTablet.dc.html`, `DuoMobile.dc.html` | Лендинг N: 1440 / 834 / 390 | `docs/04-design/README.md` |
| `DesignSystem.dc.html` | Лист дизайн-системы | `DESIGN.md` |
| `StoreV6.dc.html` | Витрина, телефон — живой прототип | `docs/04-design/storefront.md` |
| `StoreV6DeskModal.dc.html` | Витрина, компьютер: товар окном поверх сетки | там же, S8 |
| `StoreFiltersDesk.dc.html` | Витрина, компьютер: фильтры панелью поверх сетки (генератор `gen-filters-desk.cjs`) | там же, «Фильтры на компьютере» |
| `StorePreview.dc.html` | Витрина в превью из админки: плашка «Черновик» над шапкой, телефон и компьютер (генератор `gen-preview-banner.cjs`) | там же, «Превью из админки» |
| `StoreContacts.dc.html` | Витрина: контакты в «О магазине» со значками WhatsApp и Instagram — короткий и длинный логин, без Instagram, компьютер и телефон (генератор `gen-contacts.cjs`) | `docs/04-design/storefront.md`, «О магазине» |
| `StoreCartRemove.dc.html` | Витрина: корзина — счётчик «− N +» со значком корзины на единице, «Вернуть» после удаления, комментарий в панели компьютера (генератор `gen-cart-remove.cjs`) | `docs/04-design/storefront.md`, «Корзина» |
| `StoreStates.dc.html`, `StoreStatesDesk.dc.html` | Пустые и служебные состояния витрины (генераторы `gen-states*.cjs`) | там же |
| `AdminSideDraft.dc.html` | Админка, компьютер: колонка меню — опубликован и черновик в две строки (генератор `gen-admin-side-draft.cjs`, решение основателя 2026-11-02) | `docs/04-design/admin.md`, A15 |
| `AdminSetupStates.dc.html` | Админка: состояния мастера — ошибки полей, проверка адреса, загруженный логотип (генератор `gen-admin-setup-states.cjs`, T-303, утверждено 2026-11-02) | `docs/04-design/admin.md`, A14 |
| `AdminAuthPhone.dc.html`, `AdminAuthDesk.dc.html` | Админка: вход, ошибки входа и регистрации, восстановление и смена пароля, подтверждение почты (генератор `gen-admin-auth.cjs`, T-302, утверждено 2026-11-02) | `docs/04-design/admin.md`, A11 |

## На проверке (ждут решения основателя)
| Файл | Что это | Описание |
|---|---|---|
| `AdminPhone.dc.html`, `AdminDesk.dc.html` | Админка: ключевые экраны (генераторы `gen-admin-phone.cjs`, `gen-admin-desk.cjs`) | `docs/04-design/admin.md` |
| `AdminPhone2.dc.html`, `AdminDesk2.dc.html` | Админка: регистрация, мастер 1–4, новый товар, «Магазин», «О магазине», категории, наличие, статистика (генераторы `*2.cjs`) | там же |

## Архив (не выбраны, для истории)
- Лендинг, варианты A–M: `Main`, `Tag`, `Cord`, `Glass`, `Bento`, `Dark`, `Friendly`, `Magazine`, `Tactile`, `Swiss`, `Brutal`, `Clay`, `Aurora`.
- Витрина: первая версия `StoreMobile`, `StoreDesktop`; варианты `StoreV1`–`StoreV5`; компьютер «вариант Б» `StoreV6DeskSide`; фильтры на компьютере, варианты А–В — `StoreFiltersDeskVariants` (выбран Г); лендинг, телефон покупателя в примере, варианты А–Г — `LandingBuyerPhone` (генератор `gen-landing-buyer.cjs`; выбран Б со строкой наличия, он в `Duo*.dc.html`); корзина, невыбранные варианты удаления — `StoreCartRemoveVariants` (тот же генератор).

В архивных макетах встречаются старые решения (номер заказа, подтверждение и списание остатка) — по ним не ориентируемся.

## Фото товаров
В артбордах фото подключены из хранилища холста по адресам `/_blob/<id>`. Это те же файлы, что лежат в `design-assets/storefront/`:

| id | Файл |
|---|---|
| 1260977f2c0c34a5b933572bb6e99e94 | jacket.jpg |
| 4469123d08e33e3b8a0e21393b6e426b | jacket2.jpg |
| 7d0f77b8370d9af612d61812d7452e5f | dress-red.jpg |
| 04a201bc58d35022516d4467e49b7f41 | sneakers-blue.jpg |
| b7e066c9d74196dbd3a06f17035798be | beanie-gray.jpg |
| a3bc2f157acffb785bd68c64b69fa957 | raincoat.jpg |
| 8a58a9934844266efb16a8c4761e7f7b | denim-jacket.jpg |
| b10ce1436e13380c548fa804ef4347fd | hoodie-red.jpg |
| 167257d6a7f8ad684c2d856ae3a11150 | tshirt-white.jpg |
| 7cb5296df170d7a0aca0d4bd8ec7cb9e | dress-yellow.jpg |
| 2ec542edaef6635ace484ac3c7ad1f4a | sneakers-pink.jpg |
| 4425d713fea616a795f8125f90d8aed0 | coat-white.jpg |
| ca2b511d14dcdf080d3e936049667bed | beanies.jpg |
| 93fc374092f690eb46aa0b0cf74bcce4 | cardigan-gray.jpg |
| ed10ba6d31f748a438a21db8a7387c8a | dress-floral.jpg |

## Как обновлять
1. Правка через генератор: изменить `generators/*.cjs` → запустить → опубликовать получившийся `boards/*.dc.html` на холст.
2. Правка прямо на холсте: скачать изменённые файлы холста (`project/*.dc.html`, `project/canvas.json`) в `boards/` и `canvas.json`.
3. В обоих случаях — один коммит с изменением макета и документов, которых оно касается (`docs/04-design/…`).
