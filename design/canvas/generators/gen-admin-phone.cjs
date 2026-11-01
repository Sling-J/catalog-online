// Генерирует AdminPhone.dc.html — ключевые экраны админки на телефоне (8 экранов 390×844)
const fs = require("fs");
const { img, sv, P, C, pill, dot, btn, field, syncNote, toggle, thumb, noPhoto, page } = require("./admin-common.cjs");

// Верхняя строка: магазин и статус
const top = (status = "Опубликован", on = true) => `<div style="display: flex; align-items: center; gap: 10px; padding: 14px 16px 0">
<span style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; flex: none">АK</span>
<div style="flex: 1; min-width: 0"><div style="font-weight: 700; font-size: 15px">Айгерим Kids</div><div style="display: flex; align-items: center; gap: 5px; font-size: 12px; color: ${on ? C.inS : C.lowS}; font-weight: 600">${dot(on ? C.inS : "#E8A100")}${status}</div></div>
<span style="height: 36px; display: inline-flex; align-items: center; gap: 6px; padding: 0 12px; border-radius: 999px; background: ${C.haze}; font-weight: 600; font-size: 13px">${sv(P.ext, C.ink, 15)}Витрина</span>
</div>`;
// Нижнее меню на сиреневом
const NAV = [["products", "Товары"], ["import", "Импорт"], ["shop", "Магазин"]];
const nav = (active) => `<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 84px; padding: 8px 10px 0; box-sizing: border-box; background: ${C.lilac}; border-radius: 26px 26px 0 0; display: flex; gap: 4px">
${NAV.map(([k, l, n]) => { const on = k === active; return `<div style="position: relative; flex: 1; height: 56px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; ${on ? "background: #ffffff; box-shadow: 0 3px 0 rgba(90,70,190,.25)" : ""}; font-size: 12px; font-weight: ${on ? 700 : 600}; color: ${C.ink}">${sv(P[k], C.ink, 22, on ? 2.2 : 1.8)}${l}${n ? `<span style="position: absolute; top: 4px; left: calc(50% + 6px); min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box; border-radius: 999px; background: ${C.coral}; color: #ffffff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center">${n}</span>` : ""}</div>`; }).join("")}
</div>`;
const title = (t, right = "") => `<div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 16px 0"><div style="font-weight: 800; font-size: 28px; letter-spacing: -0.03em">${t}</div>${right}</div>`;
const tabs = (items) => `<div style="display: flex; gap: 8px; padding: 14px 16px 0; overflow: hidden">${items.map(([l, on, n]) => `<span style="flex: none; height: 38px; padding: 0 14px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; font-size: 14px; background: ${on ? C.ink : C.haze}; color: ${on ? "#ffffff" : C.ink}">${l}${n ? `<span style="min-width: 20px; height: 20px; padding: 0 6px; box-sizing: border-box; border-radius: 999px; background: ${on ? C.sun : "#ffffff"}; color: ${C.ink}; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center">${n}</span>` : ""}</span>`).join("")}</div>`;
const backBar = (t, right = "") => `<div style="display: flex; align-items: center; gap: 10px; padding: 14px 16px 0"><span style="width: 44px; height: 44px; border-radius: 50%; background: ${C.haze}; display: flex; align-items: center; justify-content: center; flex: none">${sv(P.back, C.ink, 20, 2.4)}</span><div style="flex: 1; font-weight: 800; font-size: 20px">${t}</div>${right}</div>`;
const card = (inner, extra = "") => `<div style="background: #ffffff; border-radius: 22px; padding: 14px; box-shadow: 0 1px 0 ${C.line}, 0 6px 16px rgba(40,30,110,.05); ${extra}">${inner}</div>`;
const S = [];

// 1. Заказы
const orderRow = (no, when, thumbs, items, sum, st, extra = "") => card(`<div style="display: flex; align-items: center; justify-content: space-between"><div style="display: flex; align-items: baseline; gap: 8px"><span style="font-weight: 800; font-size: 17px">№${no}</span><span style="font-size: 13px; color: ${C.quiet}">${when}</span></div>${st}</div>
<div style="display: flex; align-items: center; gap: 6px; margin-top: 12px">${thumbs.map((k) => thumb(k, 44, 12)).join("")}<span style="flex: 1"></span><div style="text-align: right"><div style="font-weight: 800; font-size: 16px; font-variant-numeric: tabular-nums">${sum}</div><div style="font-size: 12px; color: ${C.quiet}">${items}</div></div></div>`, extra);
const stNew = pill(dot(C.violet) + "Новый", "#ECE9FF", C.violet);
S.push(["Заказы — стартовый экран", top() + title("Заказы") + tabs([["Новые", true, "3"], ["Подтверждённые", false, "5"], ["Выданные"], ["Отменённые"]]) +
  `<div style="display: flex; flex-direction: column; gap: 10px; padding: 14px 16px 0">
${orderRow(128, "сегодня, 14:32", ["jacket", "sneakers", "beanie"], "3 позиции", "37 300 ₸", stNew, "box-shadow: inset 4px 0 0 " + C.violet + ", 0 6px 16px rgba(40,30,110,.05)")}
${orderRow(127, "сегодня, 11:05", ["dressR"], "1 позиция", "9 500 ₸", stNew, "box-shadow: inset 4px 0 0 " + C.violet + ", 0 6px 16px rgba(40,30,110,.05)")}
${orderRow(121, "28 окт, 18:40", ["hoodie", "tshirt"], "2 позиции", "12 400 ₸", pill(dot("#E8A100") + "Ждёт 3 дня", "#FFF1D6", "#7A4300"), "box-shadow: inset 4px 0 0 #E8A100, 0 6px 16px rgba(40,30,110,.05)")}
</div>
<div style="margin: 16px 16px 0; font-size: 13px; color: ${C.muted}; text-align: center">Новые заказы приходят и на почту</div>` + nav("orders")]);

// 2. Карточка заказа
const line = (k, name, v, price, qty, stock, warn) => `<div style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid #F0EEF7">${thumb(k, 52, 14)}<div style="flex: 1; min-width: 0"><div style="font-weight: 600; font-size: 14px">${name}</div><div style="font-size: 13px; color: ${C.quiet}">${v} · ${price}</div><div style="font-size: 12px; font-weight: 700; margin-top: 3px; color: ${warn ? C.coral : C.inS}">${stock}</div></div>
<div style="display: flex; align-items: center; gap: 2px; border-radius: 999px; background: #F1EFFA; padding: 3px"><span style="width: 30px; height: 30px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700">−</span><span style="min-width: 22px; text-align: center; font-weight: 700; font-size: 14px">${qty}</span><span style="width: 30px; height: 30px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700">+</span></div></div>`;
S.push(["Карточка заказа (новый)", backBar("Заказ №128", stNew) +
  `<div style="padding: 4px 16px 0 70px; font-size: 13px; color: ${C.quiet}">Сегодня, 14:32 · пришёл с витрины</div>
<div style="padding: 14px 16px 0">${card(`<div style="font-weight: 700; font-size: 15px; margin-bottom: 2px">Позиции</div>
${line("jacket", "Куртка демисезонная", "Рост 110", "18 900 ₸", 1, "На складе 3", false)}
${line("sneakers", "Кроссовки на липучках", "Размер 27", "14 200 ₸", 1, "На складе 0 — не хватает 1", true)}
${line("beanie", "Шапка вязаная", "Один размер", "4 200 ₸", 1, "На складе 14", false)}
<div style="display: flex; justify-content: space-between; align-items: baseline; padding-top: 12px; border-top: 1px solid #F0EEF7"><span style="color: ${C.soft}">Итого</span><span style="font-weight: 800; font-size: 20px; font-variant-numeric: tabular-nums">37 300 ₸</span></div>`)}</div>
<div style="padding: 12px 16px 0">${card(`<div style="font-size: 13px; font-weight: 600; color: ${C.quiet}">Комментарий покупателя</div><div style="margin-top: 4px; font-size: 15px; line-height: 1.45">Можно примерить куртку в субботу?</div>`, "background: #FFF8E1; box-shadow: none")}</div>
<div style="padding: 12px 16px 0">${field("Заметка для себя", '<span style="color: ' + C.muted + '">Телефон покупателя, договорённости…</span>')}</div>
<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 16px 24px; background: linear-gradient(rgba(251,250,255,0), ${C.paper} 30%); display: flex; gap: 10px">${btn("Отменить", "soft", "flex: none")}${btn(sv(P.check, C.mintInk, 20, 2.6) + "Подтвердить", "mint", "flex: 1")}</div>`]);

// 3. Нехватка при подтверждении
S.push(["Подтверждение: не хватает остатка", `<div style="position: absolute; inset: 0; opacity: .5">${backBar("Заказ №128")}</div><div style="position: absolute; inset: 0; background: rgba(23,19,61,.42)"></div>
<div style="position: absolute; left: 0; right: 0; bottom: 0; background: #ffffff; border-radius: 28px 28px 0 0; padding: 10px 16px 26px">
<div style="width: 40px; height: 5px; border-radius: 999px; background: #DCD8EE; margin: 0 auto 18px"></div>
<div style="width: 52px; height: 52px; border-radius: 16px; background: #FFE9E1; display: flex; align-items: center; justify-content: center">${sv(P.warn, C.coral, 26, 2.2)}</div>
<div style="font-weight: 800; font-size: 22px; margin-top: 14px">Не хватает остатка</div>
<p style="margin: 6px 0 0; font-size: 15px; line-height: 1.5; color: ${C.soft}">По учёту этого товара меньше, чем в заказе. Если он всё-таки есть — подтвердите, остаток станет 0.</p>
<div style="margin-top: 14px; display: flex; gap: 12px; align-items: center; padding: 12px; border-radius: 18px; background: #F6F5FB">${thumb("sneakers", 48, 12)}<div style="flex: 1"><div style="font-weight: 600; font-size: 14px">Кроссовки на липучках, 27</div><div style="font-size: 13px; color: ${C.coral}; font-weight: 700">В заказе 1 · на складе 0</div></div></div>
<div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px">${btn("Подтвердить всё равно", "mint", "width: 100%")}${btn("Изменить заказ", "soft", "width: 100%")}</div>
<div style="margin-top: 12px; text-align: center; font-size: 13px; color: ${C.muted}">Остальные 2 позиции спишутся как обычно</div>
</div>`]);

// 4. Товары
const prow = (k, name, cat, price, stock, tag) => `<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid #F0EEF7">${k ? thumb(k, 56, 14) : noPhoto()}<div style="flex: 1; min-width: 0"><div style="font-weight: 600; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${name}</div><div style="font-size: 13px; color: ${C.quiet}">${cat}</div>${tag ? `<div style="margin-top: 4px">${tag}</div>` : ""}</div><div style="text-align: right"><div style="font-weight: 800; font-size: 15px; font-variant-numeric: tabular-nums">${price}</div><div style="font-size: 12px; font-weight: 600; color: ${stock[1]}">${stock[0]}</div></div></div>`;
S.push(["Товары", top() + title("Товары", `<span style="width: 44px; height: 44px; border-radius: 50%; background: ${C.ink}; display: flex; align-items: center; justify-content: center">${sv(P.plus, "#ffffff", 22, 2.4)}</span>`) +
  `<div style="padding: 12px 16px 0"><div style="display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 14px; border-radius: 16px; background: ${C.haze}; color: ${C.muted}; font-size: 15px">${sv(P.search, C.muted, 18)}Название, артикул, штрихкод</div></div>` +
  tabs([["Все", true, "214"], ["Без фото", false, "37"], ["Нет в наличии", false, "12"], ["Скрытые", false, "4"]]) +
  `<div style="margin: 14px 16px 0; display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 20px; background: #FFF4D6"><span style="width: 40px; height: 40px; border-radius: 12px; background: ${C.sun}; display: flex; align-items: center; justify-content: center; flex: none">${sv(P.cam, C.ink, 20)}</span><div style="flex: 1"><div style="font-weight: 700; font-size: 14px; color: #4A3A00">37 товаров без фото</div><div style="font-size: 13px; color: #5A4A10">Без фото их не видно на витрине</div></div><span style="font-weight: 700; font-size: 14px; color: ${C.ink}">Снять →</span></div>
<div style="padding: 4px 16px 0">
${prow("jacket", "Куртка демисезонная", "Куртки · 7 вариантов", "18 900 ₸", ["24 шт.", C.inS])}
${prow(null, "Комбинезон зимний", "Куртки · 6 вариантов", "29 500 ₸", ["11 шт.", C.inS], pill("без фото", "#F1EFFA", C.quiet))}
${prow("sneakers", "Кроссовки на липучках", "Обувь · 8 вариантов", "14 200 ₸", ["мало: 3 шт.", C.lowS])}
${prow("coat", "Пальто шерстяное", "Куртки · 7 вариантов", "24 900 ₸", ["нет", C.outS], pill("скрыт", "#F1EFFA", C.quiet))}
${prow(null, "Варежки детские", "Шапки · 1 вариант", "2 900 ₸", ["30 шт.", C.inS], pill("без фото", "#F1EFFA", C.quiet))}
</div>` + nav("products")]);

// 5. Карточка товара
const vrow = (h, price, st, head) => `<div style="display: grid; grid-template-columns: 1fr 1.3fr 1fr; gap: 8px; padding: 9px 12px; ${head ? `font-size: 12px; font-weight: 600; color: ${C.quiet}` : "font-size: 15px; border-top: 1px solid #F0EEF7"}; font-variant-numeric: tabular-nums"><span>${h}</span><span>${price}</span><span style="${!head && st === "0" ? "color: " + C.outS : ""}">${st}</span></div>`;
S.push(["Карточка товара", backBar("Куртка демисезонная", `<span style="font-weight: 700; font-size: 14px; color: ${C.violet}">Витрина ↗</span>`) +
  `<div style="display: flex; gap: 8px; padding: 14px 16px 0">${thumb("jacket", 104, 18, "box-shadow: 0 0 0 3px " + C.sun)}${thumb("jacket2", 104, 18)}<span style="width: 104px; height: 104px; border-radius: 18px; border: 1.5px dashed #C9C3E3; background: #F6F5FB; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 12px; font-weight: 600; color: ${C.quiet}">${sv(P.plus, C.quiet, 22)}Фото</span></div>
<div style="padding: 6px 16px 0; font-size: 12px; color: ${C.muted}">Первое фото — обложка. Порядок меняется перетаскиванием.</div>
<div style="display: flex; flex-direction: column; gap: 12px; padding: 14px 16px 0">
${field("Название", "Куртка демисезонная", syncNote)}
${field("Категория", "Куртки", syncNote)}
<div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 2px"><div><div style="font-weight: 600; font-size: 15px">Показывать на витрине</div><div style="font-size: 12px; color: ${C.muted}">Скрытый товар виден только вам</div></div>${toggle(true)}</div>
</div>
<div style="padding: 12px 16px 0"><div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: ${C.quiet}; margin-bottom: 6px"><span>Варианты · 7</span>${syncNote}</div>
<div style="border-radius: 16px; background: #ffffff; border: 1.5px solid #E2DFF0; overflow: hidden">${vrow("Рост", "Цена", "Остаток", true)}${vrow("104", "18 900 ₸", "6")}${vrow("110", "18 900 ₸", "3")}${vrow("116", "18 900 ₸", "0")}<div style="display: flex; justify-content: space-between; padding: 9px 12px; border-top: 1px solid #F0EEF7; font-size: 13px; font-weight: 600; color: ${C.violet}"><span>Ещё 4 варианта</span><span>+ Размер</span></div></div></div>
<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 16px 24px; background: linear-gradient(rgba(251,250,255,0), ${C.paper} 30%)">${btn("Сохранить", "dark", "width: 100%")}</div>`]);

// 6. Быстрый режим «Добавить фото»
S.push(["Быстрый режим «Добавить фото»", `<div style="display: flex; align-items: center; gap: 10px; padding: 14px 16px 0"><span style="width: 44px; height: 44px; border-radius: 50%; background: ${C.haze}; display: flex; align-items: center; justify-content: center">${sv(P.x, C.ink, 18, 2.4)}</span><div style="flex: 1"><div style="font-weight: 700; font-size: 15px">Фото товаров</div><div style="font-size: 13px; color: ${C.quiet}">12 из 37</div></div><span style="font-weight: 600; font-size: 14px; color: ${C.quiet}">Пропустить</span></div>
<div style="margin: 12px 16px 0; height: 8px; border-radius: 999px; background: ${C.haze}; overflow: hidden"><div style="width: 32%; height: 100%; border-radius: 999px; background: ${C.mint}"></div></div>
<div style="padding: 18px 16px 0"><div style="font-size: 13px; color: ${C.quiet}">Кофты · арт. HD-2041</div><div style="font-weight: 800; font-size: 24px; letter-spacing: -0.02em; margin-top: 2px">Худи с капюшоном</div><div style="font-size: 14px; color: ${C.soft}; margin-top: 4px">Рост 98–128 · 8 900 ₸</div></div>
<div style="display: flex; gap: 8px; padding: 16px 16px 0"><div style="position: relative">${thumb("hoodie", 230, 24)}<span style="position: absolute; left: 10px; top: 10px">${pill("Обложка", "rgba(255,255,255,.92)", C.ink)}</span></div>
<div style="display: flex; flex-direction: column; gap: 8px"><span style="width: 112px; height: 111px; border-radius: 20px; border: 1.5px dashed #C9C3E3; background: #F6F5FB; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 12px; font-weight: 600; color: ${C.quiet}">${sv(P.cam, C.quiet, 24)}Ещё фото</span><span style="width: 112px; height: 111px; border-radius: 20px; border: 1.5px dashed #C9C3E3; background: #F6F5FB; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 12px; font-weight: 600; color: ${C.quiet}">${sv(P.img, C.quiet, 24)}Из галереи</span></div></div>
<div style="margin: 16px 16px 0; padding: 12px 14px; border-radius: 16px; background: #F1EFFA; font-size: 14px; line-height: 1.45; color: ${C.soft}">Снимайте на светлом фоне при дневном свете. Фото сожмём сами.</div>
<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 16px 26px; display: flex; gap: 10px">${btn(sv(P.cam, C.ink, 20) + "Переснять", "soft", "flex: none")}${btn("Дальше →", "mint", "flex: 1")}</div>`]);

// 7. Импорт — предпросмотр
const step = (n, l, st) => `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: ${st === "todo" ? C.muted : C.ink}"><span style="width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; ${st === "done" ? `background: ${C.mint}; color: ${C.mintInk}` : st === "now" ? `background: ${C.ink}; color: #ffffff` : `background: ${C.haze}; color: ${C.muted}`}">${st === "done" ? sv(P.check, C.mintInk, 15, 3) : n}</span>${l}</div>`;
const stat = (n, l, bg, fg) => `<div style="flex: 1; padding: 12px; border-radius: 18px; background: ${bg}"><div style="font-weight: 800; font-size: 24px; color: ${fg}; font-variant-numeric: tabular-nums">${n}</div><div style="font-size: 12px; font-weight: 600; color: ${fg}">${l}</div></div>`;
S.push(["Импорт — проверка перед загрузкой", top() + title("Импорт") +
  `<div style="display: flex; padding: 16px 16px 0">${step(1, "Файл", "done")}${step(2, "Колонки", "done")}${step(3, "Проверка", "now")}${step(4, "Готово", "todo")}</div>
<div style="margin: 16px 16px 0; display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 18px; background: #ffffff; border: 1px solid ${C.line}">${sv(P.file, C.inS, 24)}<div style="flex: 1"><div style="font-weight: 600; font-size: 14px">ostatki_31-10.xlsx</div><div style="font-size: 12px; color: ${C.quiet}">218 строк · колонки как в прошлый раз</div></div></div>
<div style="display: flex; gap: 8px; padding: 12px 16px 0">${stat(12, "новых", "#E6FBF2", C.mintInk)}${stat(203, "обновится", "#ECE9FF", "#2A2290")}${stat(3, "ошибки", "#FFE9E1", "#8A2E12")}</div>
<div style="padding: 14px 16px 0"><div style="font-weight: 700; font-size: 15px">Строки с ошибками пропустим</div>
<div style="margin-top: 8px; border-radius: 16px; background: #ffffff; border: 1.5px solid #E2DFF0; font-size: 13px; line-height: 1.4">
<div style="padding: 10px 12px"><b>Строка 45</b> · цена «12 5OO» — не число</div><div style="padding: 10px 12px; border-top: 1px solid #F0EEF7"><b>Строка 102</b> · нет артикула</div><div style="padding: 10px 12px; border-top: 1px solid #F0EEF7"><b>Строка 160</b> · артикул KD-118 повторяется</div></div></div>
<div style="margin: 14px 16px 0; display: flex; align-items: center; gap: 12px"><div style="flex: 1"><div style="font-weight: 600; font-size: 14px">Обнулить остаток у 4 товаров, которых нет в файле</div><div style="font-size: 12px; color: ${C.muted}">Иначе останутся старые остатки</div></div>${toggle(true)}</div>
<div style="position: absolute; left: 0; right: 0; bottom: 96px; padding: 0 16px">${btn("Загрузить 215 строк", "sun", "width: 100%")}</div>` + nav("import")]);

// 8. Главная — чек-лист до публикации
const ck = (done, t, sub, cta) => `<div style="display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 20px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}"><span style="width: 32px; height: 32px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center; ${done ? `background: ${C.mint}` : `border: 2px dashed #C9C3E3`}">${done ? sv(P.check, C.mintInk, 18, 3) : ""}</span><div style="flex: 1"><div style="font-weight: 700; font-size: 15px; ${done ? `color: ${C.quiet}` : ""}">${t}</div><div style="font-size: 13px; color: ${C.quiet}">${sub}</div></div>${cta ? `<span style="font-weight: 700; font-size: 14px; color: ${C.violet}">${cta}</span>` : ""}</div>`;
S.push(["Главная до публикации — чек-лист", top("Черновик — витрина скрыта", false) +
  `<div style="padding: 22px 16px 0"><div style="font-weight: 800; font-size: 28px; letter-spacing: -0.03em; line-height: 1.1">Осталось немного до запуска</div><div style="font-size: 15px; color: ${C.soft}; margin-top: 6px">2 из 4 шагов готово</div>
<div style="margin-top: 12px; height: 10px; border-radius: 999px; background: ${C.haze}; overflow: hidden"><div style="width: 50%; height: 100%; border-radius: 999px; background: ${C.mint}"></div></div></div>
<div style="display: flex; flex-direction: column; gap: 8px; padding: 18px 16px 0">
${ck(true, "Магазин настроен", "Название, WhatsApp, адрес, график")}
${ck(true, "Товары загружены", "214 товаров из Excel")}
${ck(false, "Добавьте фото", "37 товаров без фото — их не видно", "Снять →")}
${ck(false, "Опубликуйте витрину", "После этого ссылкой можно делиться")}
</div>
<div style="margin: 16px 16px 0; padding: 14px; border-radius: 20px; background: ${C.mist}"><div style="font-size: 13px; font-weight: 600; color: ${C.quiet}">Адрес витрины</div><div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px"><span style="font-weight: 700; font-size: 16px">aigerim-kids.[сервис].kz</span>${sv(P.copy, C.ink, 20)}</div></div>
<div style="position: absolute; left: 0; right: 0; bottom: 96px; padding: 0 16px">${btn("Опубликовать витрину", "sun", "width: 100%")}<div style="text-align: center; margin-top: 10px; font-size: 13px; color: ${C.muted}">Можно и без фото — добавите потом</div></div>` + nav("shop")]);

// Заказы в админке не храним (D14): экраны 1–3 убраны, чек-лист — первым
S.splice(0, 3);
S.unshift(S.pop());
const COLW = 430, ROWH = 960;
const body = S.map(([t, b], i) => {
  const x = i * COLW + 40, y = 40;
  return `<div style="position: absolute; left: ${x}px; top: ${y}px"><div style="font-weight: 700; font-size: 17px; margin: 0 0 14px 4px">${i + 1}. ${t}</div><div style="position: relative; width: 390px; height: 844px; border-radius: 40px; overflow: hidden; background: ${C.paper}; box-shadow: 0 24px 60px rgba(40,20,110,.14)">${b}</div></div>`;
}).join("\n");
fs.writeFileSync(process.argv[2], page("Админка — телефон", COLW * S.length + 40, ROWH + 40, body));
console.log("size", COLW * S.length + 40, ROWH + 40);
console.log("ok");
