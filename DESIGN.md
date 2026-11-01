---
name: catalog-online
description: Онлайн-каталог для малых магазинов — мягкий, пухлый, сиреневый «магазин в кармане»
colors:
  lilac-field: "#C9BBFF"
  lilac-mist: "#E4DCFF"
  ink-night: "#1D1B4B"
  ink-underside: "#0B0A26"
  ink-soft: "#3A3672"
  ink-quiet: "#4A4580"
  ink-muted: "#6B6694"
  paper: "#FCFBFF"
  white: "#FFFFFF"
  chip-haze: "#EEECF8"
  glass: "rgba(255, 255, 255, 0.55)"
  glass-edge: "rgba(255, 255, 255, 0.85)"
  sun: "#FFD23F"
  sun-underside: "#C79A00"
  sun-ink: "#4A3A00"
  mint: "#5EE6B0"
  mint-underside: "#26B985"
  mint-ink: "#0B3A28"
  coral: "#FF8F6B"
  coral-underside: "#D9532F"
  coral-ink: "#2A0A00"
  blush: "#FF9CC8"
  violet: "#7C6CFF"
  stock-in: "#157A52"
  stock-low: "#A35A00"
  stock-out: "#7A7598"
typography:
  display:
    fontFamily: "Geologica, system-ui, sans-serif"
    fontSize: "clamp(42px, 6.8vw, 98px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Geologica, system-ui, sans-serif"
    fontSize: "clamp(32px, 4.4vw, 58px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Geologica, system-ui, sans-serif"
    fontSize: "23px"
    fontWeight: 700
    lineHeight: 1.25
  body-lg:
    fontFamily: "Geologica, system-ui, sans-serif"
    fontSize: "clamp(18px, 1.6vw, 22px)"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Geologica, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Geologica, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.2
  caption:
    fontFamily: "Geologica, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
  price:
    fontFamily: "Geologica, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: 1.2
    fontFeature: "\"tnum\" 1"
rounded:
  pill: "999px"
  device: "52px"
  stage: "48px"
  card: "36px"
  panel: "30px"
  row: "22px"
  thumb: "18px"
  field: "16px"
spacing:
  2xs: "6px"
  xs: "10px"
  sm: "14px"
  md: "20px"
  lg: "28px"
  xl: "40px"
  2xl: "64px"
  section: "130px"
components:
  button-primary:
    backgroundColor: "{colors.sun}"
    textColor: "{colors.ink-night}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "19px 32px"
  button-dark:
    backgroundColor: "{colors.ink-night}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  button-confirm:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.mint-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "15px 24px"
  button-glass:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink-night}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "19px 30px"
  button-disabled:
    backgroundColor: "{colors.chip-haze}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
  button-round-add:
    backgroundColor: "{colors.ink-night}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    size: "44px"
  chip:
    backgroundColor: "{colors.chip-haze}"
    textColor: "{colors.ink-night}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "7px 14px"
  chip-selected:
    backgroundColor: "{colors.ink-night}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "7px 14px"
  card-glass:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink-night}"
    rounded: "{rounded.stage}"
    padding: "40px"
  card-step:
    backgroundColor: "{colors.sun}"
    textColor: "{colors.ink-night}"
    rounded: "{rounded.card}"
    padding: "30px"
  product-row:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-night}"
    rounded: "{rounded.row}"
    padding: "10px"
  input-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-night}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "14px 18px"
  nav-bar:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink-night}"
    rounded: "{rounded.pill}"
    padding: "10px 10px 10px 24px"
---

# Design System: catalog-online

## Overview

**Creative North Star: "Магазин в кармане"**

Главный герой каждого экрана — телефон и то, что происходит на нём под пальцем. Покупатель держит магазин в ладони: смотрит товары, выбирает размер, отправляет заказ. Владелец получает готовый заказ в свой WhatsApp и отвечает покупателю там же. Поэтому интерфейс сделан как предмет, который приятно трогать: пухлые кнопки с «подложкой», мягкое стекло, скруглённые как у телефона углы. Вокруг парят объёмные пластилиновые предметы из мира магазина: пакет, бирка размера, облачко заказа.

Мир один на все поверхности: лендинг, витрина магазина и админка одинаково яркие (решение основателя). Сиреневое поле, стеклянные панели, шрифт Geologica, жёлтый для главного действия, мятный для подтверждения. Плотность при этом разная: на лендинге много воздуха, в витрине и админке больше данных. Исключения — фон витрины: там светлая однотонная бумага вместо сиреневого поля, чтобы цвет давали фото товаров; и админка: сиреневое только меню, рабочая область на бумаге (решения основателя, 2026-10-31). Предметы никогда не закрывают данные и элементы управления.

Отклонены основателем: дешёвый «базарный» вид и скучный корпоративный.

**Key Characteristics:**
- Сиреневое поле как основа каждой страницы, контент на белой бумаге или стекле.
- Пухлые кнопки-«пилюли» с плотной цветной подложкой снизу, которые проседают при нажатии.
- Матовое стекло для навигации, панелей и вопросов.
- Парящие пластилиновые предметы как фирменный знак.
- Один шрифт Geologica, жирные заголовки с плотным трекингом.
- Цвет наличия всегда одинаковый: зелёный «есть», янтарный «мало», серо-сиреневый «нет».

## Colors

Сиреневое поле, тёмные чернила-ночь и три сочных акцента (солнце, мята, коралл), каждый со своей «подложкой» для объёма.

### Primary
- **Солнечный жёлтый** (sun): главное действие страницы, «Создать каталог», и выбранное количество в корзине. Подложка — sun-underside.
- **Чернила-ночь** (ink-night): весь основной текст, тёмные кнопки, выбранные чипы, рамка «Ваш WhatsApp». Подложка — ink-underside.

### Secondary
- **Мята** (mint): отправка и успех — «Заказать через WhatsApp», «Сохранено», «Импорт применён». Текст на ней — mint-ink.

### Tertiary
- **Коралл** (coral): второй тёплый акцент в шагах и предметах, никогда не в ошибках. Текст на нём — coral-ink.
- **Румянец и фиалка** (blush, violet): только в градиентах аватаров и предметов.

### Neutral
- **Сиреневое поле** (lilac-field): фон страниц лендинга; в админке — только меню (рабочая область на бумаге).
- **Сиреневая дымка** (lilac-mist): спокойные зоны внутри поля и фон пустых состояний.
- **Бумага** (paper) и **белый** (white): поверхности с данными — экран телефона, строки товаров, таблицы админки. Бумага — ещё и фон всей витрины магазина.
- **Дымка чипов** (chip-haze): фон невыбранных чипов и неактивных кнопок.
- **Стекло и кромка стекла** (glass, glass-edge): панели, навигация, вопросы.
- **Чернила мягкие, тихие, приглушённые** (ink-soft, ink-quiet, ink-muted): вторичный текст на поле, подписи на поле, подписи на бумаге.

### Status
- **Есть** (stock-in), **мало** (stock-low), **нет** (stock-out): только для наличия, текстом и точкой рядом.

### Named Rules
**The Underside Rule.** Каждая залитая кнопка и каждый яркий блок имеют подложку — более тёмный тон своего цвета, сдвинутый вниз без размытия. Без подложки кнопка выглядит плоской и чужой.

**The One Sun Rule.** Жёлтый — одна главная кнопка на экран. Если жёлтых кнопок две, одна из них лишняя.

**The Status Is Sacred Rule.** Зелёный, янтарный и серо-сиреневый означают наличие и ничего больше. Мятный (mint) — кнопки и успех, не путать со stock-in.

**The AA Rule.** Мелкий текст (меньше 18px) — только ink-night, ink-soft, ink-muted и status-цвета этой системы: все они проходят 4.5:1 на своих фонах. Более светлые сиреневые серые — только для крупного текста и декора.

## Typography

**Display Font:** Geologica (с system-ui)
**Body Font:** Geologica (с system-ui)

**Character:** один современный гротеск с кириллицей на всё. Тяжёлый (800) и плотный в заголовках, спокойный в тексте; характер даёт вес, а не смена гарнитур.

### Hierarchy
- **Display**: главный заголовок страницы, один на экран, до 14 знаков в строке.
- **Headline**: заголовки секций.
- **Title**: заголовки карточек, шагов, вопросов.
- **Body-lg**: подзаголовок под главным заголовком, до 44 знаков в строке.
- **Body**: текст ответов, описаний, до 65–75 знаков в строке.
- **Label**: кнопки, вкладки, навигация.
- **Caption**: подписи, статусы наличия, мелкие пояснения.
- **Price**: цены, с табличными цифрами, чтобы суммы стояли ровно.

### Named Rules
**The Tight Heads Rule.** Чем крупнее заголовок, тем плотнее трекинг: display −0.045em, headline −0.04em. Текст и подписи без трекинга.

**The Tabular Money Rule.** Все цены, суммы и количества — с табличными цифрами и пробелом между разрядами: «18 900 ₸».

## Layout

Контейнер до 1200px по центру с полями 24px. Секции идут столбиком, между ними 130px на десктопе и 64px на телефоне.

- **Десктоп (больше 1000px):** композиции «телефон в центре» и пары телефонов рядом.
- **Планшет (до 1000px):** те же композиции, телефоны сужаются до 300px, предметы мельче.
- **Телефон (до 720px):** один столбец, главная кнопка на всю ширину, в шапке только логотип и одна кнопка. Две параллельные сцены превращаются в вкладки, а после действия интерфейс сам переключает на нужную.

Ряды карточек — flex с переносом, минимальная ширина карточки 280px. Сенсорные цели не меньше 44×44px.

**The Phone Is The Unit Rule.** Ключевая демонстрация всегда помещается в один экран телефона (до 660px высотой). Если не помещается — делим на вкладки, а не растягиваем.

## Elevation & Depth

Глубина гибридная. У стекла — размытие фона и белая кромка. У кнопок и ярких блоков — плотная подложка без размытия. У телефонов и предметов — мягкие длинные сиреневые тени. Серых теней нет: все тени окрашены в сиреневый или в тон своего объекта.

### Shadow Vocabulary
- **Подложка кнопки** (`box-shadow: 0 5–7px 0 <underside>`): залитые кнопки и яркие блоки.
- **Стекло** (`backdrop-filter: blur(16–24px) saturate(160%)` + `border: 1px solid glass-edge`): навигация, панели, вопросы.
- **Телефон** (`box-shadow: 0 40px 90px rgba(40,20,110,.28)`): устройства.
- **Предмет** (`box-shadow: inset -10px -14px 22px <тень тона>, inset 9px 10px 18px rgba(255,255,255,.45), 0 30px 40px rgba(60,30,120,.25)`): пластилиновые предметы.
- **Строка товара** (`box-shadow: 0 6px 16px rgba(40,30,110,.07)`): карточки и строки на бумаге.

**The Press Rule.** При нажатии кнопка опускается на высоту подложки (`translateY(4px)`), при наведении приподнимается на 3px с пружинящей кривой.

## Shapes

Всё скруглено, острых углов нет. Кнопки, чипы и вкладки — пилюли. Радиусы растут вместе с размером объекта: поле ввода 16px, миниатюра 18px, строка 22px, панель 30px, карточка 36px, сцена 48px, телефон 52px. На телефоне большие блоки уменьшают радиус до 36px.

**The Nested Radius Rule.** Внутренний радиус равен внешнему минус отступ: телефон 52px с отступом 12px — экран 40px.

## Components

### Buttons
Пухлые, тёплые, их хочется нажать.
- **Shape:** пилюля (999px).
- **Primary:** солнечный жёлтый, текст чернилами, подложка sun-underside, 19px × 32px.
- **Dark:** чернила-ночь, белый текст, подложка ink-underside — навигация и второстепенные действия.
- **Confirm:** мята, текст mint-ink, подложка mint-underside — отправка заказа в WhatsApp и подтверждение действий (сохранить, применить импорт).
- **Glass:** стекло с белой кромкой и сиреневой подложкой — вторичное действие рядом с главным.
- **Round add:** круг 44px, чернила; после добавления становится жёлтым и показывает количество.
- **Disabled:** дымка чипов, приглушённый текст, без подложки и без реакции.
- **Hover / Focus:** подъём на 3px за 0.25s с пружиной `cubic-bezier(.34,1.56,.64,1)`; фокус — кольцо 3px ink-night с отступом 3px.

### Chips
- **Style:** пилюля, дымка чипов, caption.
- **State:** выбранный — чернила-ночь с белым текстом и маленькой подложкой; отсутствующий размер — зачёркнутый приглушённый текст.

### Cards / Containers
- **Corner Style:** сцена 48px, карточка 36px, панель 30px.
- **Background:** стекло на поле; белый или бумага для данных; солнце, коралл или мята для шагов.
- **Shadow Strategy:** стекло — размытие и кромка; цветные блоки — подложка 8px.
- **Internal Padding:** 30–40px на десктопе, 24–28px на телефоне.

### Inputs / Fields
- **Style:** белое поле, радиус 16px, тонкая рамка chip-haze, текст body.
- **Focus:** рамка ink-night 2px и мягкое сиреневое свечение.
- **Error / Disabled:** ошибка — рамка coral-underside и подпись под полем; неактивное — фон chip-haze.

### Navigation
Стеклянная пилюля на всю ширину контейнера: логотип слева, ссылки и тёмная кнопка справа. На телефоне — только логотип и кнопка.

### Device Frame (signature)
Стеклянный телефон: внешний радиус 52px, отступ 12px, экран на бумаге. Тёмная версия (чернила с прозрачностью 0.82) — для «Вашего WhatsApp».

### Product Row (signature)
Белая строка 22px: миниатюра 60px, название, цена, статус наличия точкой и текстом, круглая кнопка «+».

### Clay Object (signature)
Объёмный предмет из мира магазина (пакет, бирка размера, облачко заказа, шарик): радиальный градиент светлый → базовый → глубокий тон, две внутренние тени и длинная мягкая тень. Медленно парит (5–7с, по-разному у каждого). Сейчас это CSS-заглушки; финально — 3D-иллюстрации в том же цвете и свете.

## Do's and Don'ts

### Do:
- **Do** держать сиреневое поле фоном лендинга и меню админки, а данные — на белом или бумаге. Витрина целиком на бумаге: цвет в ней дают фото товаров.
- **Do** давать каждой залитой кнопке подложку её тона.
- **Do** показывать наличие цветом и текстом вместе: «Осталось 1».
- **Do** ставить предметы в поля, шапки секций, пустые состояния и экраны успеха.
- **Do** на телефоне превращать параллельные сцены во вкладки.
- **Do** задавать цвета через токены, чтобы позже добавить тёмную тему без переделки.

### Don't:
- **Don't** делать «базарно»: никаких кричащих скидочных плашек, мигания, красного «SALE».
- **Don't** делать скучно-корпоративно: никаких серых плоских кнопок без подложки и серых теней.
- **Don't** ставить парящие предметы поверх таблиц, форм, цен и кнопок.
- **Don't** использовать больше одной жёлтой кнопки на экране.
- **Don't** использовать мятный, янтарный или зелёный не по назначению.
- **Don't** использовать светлые сиреневые серые для текста меньше 18px.
