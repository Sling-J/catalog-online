// Генерирует AdminProductsStates.dc.html — состояния раздела «Товары» (T-305), которых нет в AdminPhone (экран 2),
// AdminDesk (экран 1) и AdminPhone2 (экран 6): выбор товаров на телефоне, смена категории, ничего не найдено,
// пустая вкладка, загрузка, ошибка, «Товаров пока нет» на компьютере, сообщение после массового действия.
// node gen-admin-products-states.cjs boards/AdminProductsStates.dc.html
// Части собраны так же, как утверждённые экраны: строки, вкладки, панель выбора — из AdminPhone / AdminDesk.
const fs = require("fs");
const { sv, P, C, btn, dot, pill, toggle, thumb, noPhoto, page } = require("./admin-common.cjs");

const eyeOff = '<path d="M3 3l18 18"></path><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4"></path><path d="M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6"></path><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path>';
const ROWS = [
  { k: "jacket", name: "Куртка демисезонная", sku: "KD-1001", cat: "Куртки", n: "7 вариантов", price: "18 900 ₸", stock: "24 шт.", lvl: "in", on: true },
  { k: null, name: "Комбинезон зимний", sku: "KM-2210", cat: "Куртки", n: "6 вариантов", price: "29 500 ₸", stock: "11 шт.", lvl: "in", on: true },
  { k: "raincoat", name: "Дождевик жёлтый", sku: "DZ-0412", cat: "Куртки", n: "5 вариантов", price: "7 900 ₸", stock: "9 шт.", lvl: "in", on: true },
  { k: "sneakers", name: "Кроссовки на липучках", sku: "SN-0027", cat: "Обувь", n: "8 вариантов", price: "14 200 ₸", stock: "3", lvl: "low", on: true },
  { k: "coat", name: "Пальто шерстяное", sku: "PL-3001", cat: "Куртки", n: "7 вариантов", price: "24 900 ₸", stock: "нет", lvl: "out", on: false },
  { k: "dressY", name: "Платье летнее", sku: "PT-0815", cat: "Платья", n: "6 вариантов", price: "8 200 ₸", stock: "4 шт.", lvl: "in", on: true },
  { k: null, name: "Варежки детские", sku: "VR-0101", cat: "Шапки", n: "1 вариант", price: "2 900 ₸", stock: "30 шт.", lvl: "in", on: true },
];
const CATS = ["Куртки", "Платья", "Кофты и футболки", "Обувь", "Шапки"];
const TABS = [["Все", "214"], ["Без фото", "37"], ["Нет в наличии", "12"], ["Скрытые", "4"]];
const lvlColor = { in: C.inS, low: C.lowS, out: C.outS };

// чекбокс — как в AdminDesk
const box = (on, light = false) => on
  ? `<span style="width: 20px; height: 20px; border-radius: 6px; flex: none; display: inline-flex; align-items: center; justify-content: center; background: ${light ? C.sun : C.ink}">${sv(P.check, light ? C.ink : "#ffffff", 14, 3)}</span>`
  : `<span style="width: 20px; height: 20px; border-radius: 6px; flex: none; display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid #C9C3E3; background: #ffffff"></span>`;
const tabs = (active, counts = TABS.map(([, n]) => n), wrap = "padding: 14px 16px 0; overflow: hidden") => `<div style="display: flex; gap: 8px; ${wrap}">${TABS.map(([t], i) => { const on = i === active; return `<span style="flex: none; height: 38px; padding: 0 14px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; font-size: 14px; background: ${on ? C.ink : C.haze}; color: ${on ? "#ffffff" : C.ink}">${t}<span style="min-width: 20px; height: 20px; padding: 0 6px; box-sizing: border-box; border-radius: 999px; background: ${on ? C.sun : "#ffffff"}; color: ${C.ink}; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center">${counts[i]}</span></span>`; }).join("")}</div>`;
const caret = (w = 2) => `<span style="width: 2px; height: 20px; background: ${C.ink}; flex: none; margin-left: ${w}px"></span>`;
const clearX = `<span style="margin-left: auto; width: 24px; height: 24px; border-radius: 50%; background: #DCD8EE; display: flex; align-items: center; justify-content: center; flex: none">${sv(P.x, C.ink, 14, 2.4)}</span>`;

// ───── Телефон: шапка и меню — как AdminPhone, экран 2 (опубликован) ─────
const top = `<div style="display: flex; align-items: center; gap: 10px; padding: 14px 16px 0">
<span style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; flex: none">АK</span>
<div style="flex: 1; min-width: 0"><div style="font-weight: 700; font-size: 15px">Айгерим Kids</div><div style="display: flex; align-items: center; gap: 5px; font-size: 12px; color: ${C.inS}; font-weight: 600">${dot(C.inS)}Опубликован</div></div>
<span style="height: 36px; display: inline-flex; align-items: center; gap: 6px; padding: 0 12px; border-radius: 999px; background: ${C.haze}; font-weight: 600; font-size: 13px">${sv(P.ext, C.ink, 15)}Витрина</span>
</div>`;
const NAV = [["products", "Товары"], ["import", "Импорт"], ["shop", "Магазин"]];
const nav = `<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 84px; padding: 8px 10px 0; box-sizing: border-box; background: ${C.lilac}; border-radius: 26px 26px 0 0; display: flex; gap: 4px">
${NAV.map(([k, l]) => { const on = k === "products"; return `<div style="position: relative; flex: 1; height: 56px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; ${on ? "background: #ffffff; box-shadow: 0 3px 0 rgba(90,70,190,.25)" : ""}; font-size: 12px; font-weight: ${on ? 700 : 600}; color: ${C.ink}">${sv(P[k], C.ink, 22, on ? 2.2 : 1.8)}${l}</div>`; }).join("")}
</div>`;
const title = `<div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 16px 0"><div style="font-weight: 800; font-size: 28px; letter-spacing: -0.03em">Товары</div><span style="width: 44px; height: 44px; border-radius: 50%; background: ${C.ink}; display: flex; align-items: center; justify-content: center">${sv(P.plus, "#ffffff", 22, 2.4)}</span></div>`;
const search = (value) => `<div style="padding: 12px 16px 0"><div style="display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 14px; border-radius: 16px; background: ${C.haze}; color: ${value ? C.ink : C.muted}; font-size: 15px">${sv(P.search, C.muted, 18)}${value ? `${value}${caret()}${clearX}` : "Название, артикул, штрихкод"}</div></div>`;
const banner = `<div style="margin: 14px 16px 0; display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 20px; background: #FFF4D6"><span style="width: 40px; height: 40px; border-radius: 12px; background: ${C.sun}; display: flex; align-items: center; justify-content: center; flex: none">${sv(P.cam, C.ink, 20)}</span><div style="flex: 1"><div style="font-weight: 700; font-size: 14px; color: #4A3A00">37 товаров без фото</div><div style="font-size: 13px; color: #5A4A10">Без фото их не видно на витрине</div></div><span style="font-weight: 700; font-size: 14px; color: ${C.ink}">Снять →</span></div>`;
const tag = (r) => r.k ? (r.on ? "" : pill("скрыт", "#F1EFFA", C.quiet)) : pill("без фото", "#F1EFFA", C.quiet);
const phoneRow = (r, sel) => {
  const label = tag(r);
  const stock = r.lvl === "low" ? `мало: ${r.stock} шт.` : r.stock;
  return `<div style="display: flex; gap: 12px; align-items: center; padding: 10px ${sel === undefined ? 0 : "16px"}; border-bottom: 1px solid #F0EEF7; ${sel ? "background: #F4F1FF" : ""}">${sel === undefined ? "" : box(sel)}${r.k ? thumb(r.k, 56, 14) : noPhoto(56, 14)}<div style="flex: 1; min-width: 0"><div style="font-weight: 600; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${r.name}</div><div style="font-size: 13px; color: ${C.quiet}">${r.cat} · ${r.n}</div>${label ? `<div style="margin-top: 4px">${label}</div>` : ""}</div><div style="text-align: right"><div style="font-weight: 800; font-size: 15px; font-variant-numeric: tabular-nums">${r.price}</div><div style="font-size: 12px; font-weight: 600; color: ${lvlColor[r.lvl]}">${stock}</div></div></div>`;
};
const list = (rows) => `<div style="padding: 4px 16px 0">${rows.map((r) => phoneRow(r)).join("")}</div>`;
// пустые состояния внутри списка — по образцу «Товаров пока нет» (AdminPhone2, экран 6), без глиняной фигуры
const emptyIcon = (path, bg, color) => `<span style="width: 64px; height: 64px; border-radius: 22px; background: ${bg}; display: flex; align-items: center; justify-content: center; margin: 0 auto">${sv(path, color, 28, 2.2)}</span>`;
const emptyBlock = (icon, head, text, action = "", pad = "48px 24px 0") => `<div style="padding: ${pad}; text-align: center">${icon}<div style="font-weight: 800; font-size: 20px; margin-top: 18px">${head}</div><div style="font-size: 15px; line-height: 1.5; color: ${C.soft}; margin-top: 8px">${text}</div>${action ? `<div style="margin-top: 20px">${action}</div>` : ""}</div>`;
const skelRow = (w1, w2) => `<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid #F0EEF7"><span style="width: 56px; height: 56px; border-radius: 14px; background: ${C.haze}; flex: none"></span><div style="flex: 1"><div style="width: ${w1}px; height: 14px; border-radius: 7px; background: ${C.haze}"></div><div style="width: ${w2}px; height: 12px; border-radius: 6px; background: #F3F2FA; margin-top: 8px"></div></div><div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px"><div style="width: 64px; height: 14px; border-radius: 7px; background: ${C.haze}"></div><div style="width: 40px; height: 12px; border-radius: 6px; background: #F3F2FA"></div></div></div>`;
const SKEL = [[170, 110], [140, 96], [190, 120], [150, 104], [176, 90], [130, 112], [160, 100]];

// выбор на телефоне: долгое нажатие на строку; шапка выбора вместо заголовка, панель действий вместо меню
const selHead = (n) => `<div style="display: flex; align-items: center; gap: 12px; padding: 18px 16px 0"><span style="width: 44px; height: 44px; border-radius: 50%; background: ${C.haze}; display: flex; align-items: center; justify-content: center; flex: none">${sv(P.x, C.ink, 20, 2.4)}</span><div style="flex: 1; font-weight: 800; font-size: 22px; letter-spacing: -0.02em">Выбрано ${n}</div><span style="font-weight: 700; font-size: 14px; color: ${C.violet}">Выбрать все</span></div>`;
const ACTIONS = [[eyeOff, "Скрыть"], [P.eye, "Показать"], [P.products, "Категория"]];
const actionBar = `<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 84px; padding: 8px 10px 0; box-sizing: border-box; background: ${C.ink}; border-radius: 26px 26px 0 0; display: flex; gap: 4px">
${ACTIONS.map(([d, l]) => `<div style="flex: 1; height: 56px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; background: rgba(255,255,255,.14); color: #ffffff; font-size: 12px; font-weight: 700">${sv(d, "#ffffff", 22, 2)}${l}</div>`).join("")}
</div>`;
const SELECTED = [true, true, false, false, false, false, false];
const selection = (n, sel) => top + selHead(n) + search() + tabs(0) + `<div style="padding: 4px 0 0; margin-top: 10px">${ROWS.slice(0, 7).map((r, i) => phoneRow(r, sel[i])).join("")}</div>` + actionBar;

// шторка выбора категории (как шторки витрины: затемнение, ручка, заголовок)
const radio = (on) => `<span style="width: 22px; height: 22px; border-radius: 50%; flex: none; box-sizing: border-box; ${on ? `border: 7px solid ${C.ink}` : "border: 2px solid #C9C3E3"}; background: #ffffff"></span>`;
const catOption = (t, on, sub = "") => `<div style="display: flex; align-items: center; gap: 12px; height: 52px; padding: 0 4px; border-bottom: 1px solid #F0EEF7"><div style="flex: 1; font-size: 16px; font-weight: ${on ? 700 : 500}">${t}${sub ? `<span style="font-weight: 500; color: ${C.muted}"> · ${sub}</span>` : ""}</div>${radio(on)}</div>`;
const catSheet = `<div style="position: absolute; inset: 0; background: rgba(23,19,61,.42)"></div>
<div style="position: absolute; left: 0; right: 0; bottom: 0; background: #ffffff; border-radius: 28px 28px 0 0; padding: 10px 16px 24px">
<div style="width: 40px; height: 5px; border-radius: 999px; background: #DCD8EE; margin: 0 auto 14px"></div>
<div style="font-weight: 800; font-size: 20px">Перенести в категорию</div><div style="font-size: 14px; color: ${C.quiet}; margin-top: 4px">2 товара</div>
<div style="margin-top: 10px">${CATS.map((c, i) => catOption(c, i === 2)).join("")}${catOption("Без категории", false)}</div>
<div style="margin-top: 18px">${btn("Перенести", "dark", "width: 100%")}</div></div>`;

const retry = btn("Повторить", "dark", "height: 48px; font-size: 15px");
const PH = [
  ["Выбор: долгое нажатие на строку", selection(2, SELECTED)],
  ["Выбор → «Категория»", selection(2, SELECTED) + catSheet],
  ["Поиск — ничего не нашлось", top + title + search("пуховик") + tabs(0) +
    emptyBlock(emptyIcon(P.search, C.haze, C.ink), "Ничего не нашлось", "По запросу «пуховик» товаров нет. Ищем по названию, артикулу и штрихкоду.", btn("Сбросить поиск", "soft", "height: 48px; font-size: 15px")) + nav],
  ["Пустая вкладка «Без фото»", top + title + search() + tabs(1, ["214", "0", "12", "4"]) +
    emptyBlock(`<span style="width: 64px; height: 64px; border-radius: 50%; background: ${C.mint}; display: flex; align-items: center; justify-content: center; margin: 0 auto">${sv(P.check, C.mintInk, 30, 3)}</span>`, "У всех товаров есть фото", "Покупатели видят каждый товар на витрине.") + nav],
  ["Загрузка", top + title + search() + tabs(0, ["…", "…", "…", "…"]).replace(/>…</g, `><span style="width: 14px; height: 8px; border-radius: 4px; background: #DCD8EE"></span><`) +
    `<div style="padding: 18px 16px 0">${SKEL.map(([a, b]) => skelRow(a, b)).join("")}</div>` + nav],
  ["Не загрузилось", top + title + search() + tabs(0) +
    emptyBlock(emptyIcon(P.warn, "#FFE8E0", C.coral), "Не получилось загрузить товары", "Проверьте интернет и попробуйте ещё раз.", retry) + nav],
];

// ───── Компьютер: колонка — как AdminDesk, экран 1 (опубликован) ─────
const NAVD = [["products", "Товары"], ["import", "Импорт"], ["shop", "Магазин"]];
const side = (count) => `<div style="position: absolute; left: 0; top: 0; bottom: 0; width: 248px; padding: 22px 16px; box-sizing: border-box; background: ${C.lilac}; display: flex; flex-direction: column">
<div style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 20px; background: rgba(255,255,255,.55)"><span style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center">АK</span><div><div style="font-weight: 700; font-size: 15px">Айгерим Kids</div>${count === "0"
  ? `<div style="display: flex; align-items: flex-start; gap: 5px; font-size: 12px; font-weight: 600; color: ${C.lowS}"><span style="width: 8px; height: 8px; border-radius: 50%; background: #E8A100; flex: none; margin-top: 4px"></span><span>Черновик<br>Витрина скрыта</span></div>`
  : `<div style="display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: ${C.inS}">${dot(C.inS)}Опубликован</div>`}</div></div>
<div style="display: flex; flex-direction: column; gap: 4px; margin-top: 22px">${NAVD.map(([k, l]) => { const on = k === "products"; return `<div style="display: flex; align-items: center; gap: 12px; height: 48px; padding: 0 14px; border-radius: 16px; font-size: 15px; font-weight: ${on ? 700 : 600}; ${on ? "background: #ffffff; box-shadow: 0 3px 0 rgba(90,70,190,.25)" : ""}">${sv(P[k], C.ink, 20, on ? 2.2 : 1.8)}<span style="flex: 1">${l}</span>${k === "products" ? `<span style="min-width: 22px; height: 22px; padding: 0 7px; box-sizing: border-box; border-radius: 999px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,.6)">${count}</span>` : ""}</div>`; }).join("")}</div>
<span style="flex: 1"></span>
<div style="padding: 14px; border-radius: 20px; background: rgba(255,255,255,.55); font-size: 13px"><div style="font-weight: 600; color: ${C.quiet}">Ваша витрина</div><div style="font-weight: 700; margin-top: 2px">aigerim-kids.[сервис].kz</div><div style="display: flex; gap: 6px; margin-top: 10px"><span style="flex: 1; height: 36px; border-radius: 12px; background: ${C.ink}; color: #ffffff; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px">${sv(P.ext, "#ffffff", 14)}Открыть</span><span style="width: 36px; height: 36px; border-radius: 12px; background: #ffffff; display: flex; align-items: center; justify-content: center">${sv(P.copy, C.ink, 16)}</span></div></div>
</div>`;
const deskHead = (value, counts) => `<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px"><div style="font-weight: 800; font-size: 30px; letter-spacing: -0.03em">Товары</div><div style="display: flex; gap: 10px; align-items: center">${btn(sv(P.import, C.ink, 18) + "Загрузить Excel", "line", "height: 44px; font-size: 14px; padding: 0 18px")}${btn(sv(P.plus, "#ffffff", 18, 2.4) + "Товар", "dark", "height: 44px; font-size: 14px")}</div></div>
<div style="display: flex; align-items: center; gap: 12px; margin-top: 18px"><div style="width: 360px; display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 14px; box-sizing: border-box; border-radius: 14px; background: ${C.haze}; color: ${value ? C.ink : C.muted}; font-size: 14px">${sv(P.search, C.muted, 17)}${value ? `${value}${caret()}${clearX}` : "Название, артикул, штрихкод"}</div>${tabs(0, counts, "")}<span style="flex: 1"></span><span style="height: 40px; display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; border: 1.5px solid #DAD6EC; border-radius: 999px; background: #ffffff; font-weight: 600; font-size: 14px">Все категории${sv(P.down, C.ink, 15)}</span></div>`;
const GRID = "grid-template-columns: 40px 64px 1fr 150px 110px 120px 120px 90px; gap: 12px";
const tableHead = `<div style="display: grid; ${GRID}; padding: 12px 18px; font-size: 12px; font-weight: 600; color: ${C.quiet}"><span></span><span>Фото</span><span>Название</span><span>Категория</span><span>Варианты</span><span>Цена</span><span>Остаток</span><span>Витрина</span></div>`;
const deskRow = (r, sel, over = {}) => { const x = { ...r, ...over }; return `<div style="display: grid; ${GRID}; align-items: center; padding: 10px 18px; border-top: 1px solid #F0EEF7; font-size: 14px; ${sel ? "background: #F4F1FF" : ""}">${box(sel)}${x.k ? thumb(x.k, 48, 12) : noPhoto(48, 12)}<div style="min-width: 0"><div style="font-weight: 600">${x.name}</div><div style="font-size: 12px; color: ${C.quiet}">арт. ${x.sku}${x.k ? "" : " · без фото"}</div></div><span>${x.cat}</span><span style="color: ${C.quiet}">${x.n}</span><span style="font-weight: 700; font-variant-numeric: tabular-nums">${x.price}</span><span style="font-weight: 600; color: ${lvlColor[x.lvl]}">${x.lvl === "low" ? `мало: ${x.stock}` : x.stock}</span>${toggle(x.on)}</div>`; };
const bulkBar = (n) => `<div style="display: flex; align-items: center; gap: 14px; padding: 12px 18px; background: ${C.ink}; color: #ffffff; font-size: 14px; font-weight: 600">${box(true, true)}<span>Выбрано ${n}</span><span style="flex: 1"></span><span style="padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,.14)">Скрыть</span><span style="padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,.14)">Показать</span><span style="position: relative; padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,.32)">Сменить категорию</span><span style="opacity: .7">Снять выбор</span></div>`;
const card = (inner) => `<div style="margin-top: 16px; border-radius: 24px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}, 0 6px 16px rgba(40,30,110,.05); overflow: hidden">${inner}</div>`;
const foot = (t) => `<div style="display: flex; justify-content: space-between; padding: 14px 18px; border-top: 1px solid #F0EEF7; font-size: 13px; color: ${C.quiet}"><span>${t}</span><span>Подгружаются при прокрутке</span></div>`;
const main = (inner) => `<div style="position: absolute; left: 248px; top: 0; right: 0; bottom: 0; background: ${C.paper}"><div style="padding: 28px 32px">${inner}</div></div>`;
// выпадающий список категорий под кнопкой «Сменить категорию»
const catMenu = `<div style="position: absolute; right: 155px; top: 204px; width: 280px; padding: 8px; border-radius: 20px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}, 0 18px 40px rgba(40,20,110,.18)">
<div style="padding: 8px 12px 6px; font-size: 12px; font-weight: 600; color: ${C.quiet}">Перенести 3 товара в</div>
${CATS.map((c, i) => `<div style="display: flex; align-items: center; height: 40px; padding: 0 12px; border-radius: 12px; font-size: 14px; font-weight: 600; ${i === 1 ? `background: ${C.haze}` : ""}">${c}</div>`).join("")}
<div style="height: 1px; background: #F0EEF7; margin: 6px 4px"></div><div style="display: flex; align-items: center; height: 40px; padding: 0 12px; border-radius: 12px; font-size: 14px; font-weight: 600; color: ${C.quiet}">Без категории</div></div>`;
const toast = (t) => `<div style="position: absolute; left: 50%; bottom: 32px; transform: translateX(-50%); display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 18px; border-radius: 999px; background: ${C.ink}; color: #ffffff; font-size: 14px; font-weight: 600; box-shadow: 0 12px 30px rgba(23,19,61,.3)"><span style="width: 22px; height: 22px; border-radius: 50%; background: ${C.mint}; display: flex; align-items: center; justify-content: center">${sv(P.check, C.mintInk, 14, 3)}</span>${t}</div>`;
const SEL3 = [true, true, true, false, false, false, false];
const emptyCard = (icon, head, text, action) => card(tableHead + `<div style="border-top: 1px solid #F0EEF7; padding: 64px 24px 72px">${emptyBlock(icon, head, text, action, "0")}</div>`);
const choice = (iconBg, icon, t, s) => `<div style="flex: 1; display: flex; align-items: center; gap: 14px; padding: 18px; border-radius: 22px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}, 0 6px 16px rgba(40,30,110,.05)"><span style="width: 48px; height: 48px; border-radius: 16px; background: ${iconBg}; display: flex; align-items: center; justify-content: center; flex: none">${sv(icon, C.ink, 22)}</span><div style="flex: 1"><div style="font-weight: 700; font-size: 16px">${t}</div><div style="font-size: 13px; color: ${C.quiet}">${s}</div></div>${sv(P.chev, C.quiet, 18)}</div>`;
const clay = `<div aria-hidden="true" style="width: 96px; height: 120px; margin: 0 auto; transform: rotate(8deg); border-radius: 22px; background: radial-gradient(120% 90% at 30% 15%, #FFF0A8, #FFD23F 55%, #E3AE00); box-shadow: inset -10px -14px 20px rgba(80,40,0,.28), inset 8px 9px 16px rgba(255,255,255,.55), 0 24px 36px rgba(60,30,120,.22)"><div style="width: 18px; height: 18px; border-radius: 50%; margin: 14px auto 0; background: #FBFAFF"></div><div style="font-weight: 800; font-size: 30px; margin-top: 12px; color: #6B4E00">0</div></div>`;

const DK = [
  ["Товаров пока нет", side("0") + main(`<div style="font-weight: 800; font-size: 30px; letter-spacing: -0.03em">Товары</div>
<div style="width: 640px; margin: 80px auto 0; text-align: center">${clay}<div style="font-weight: 800; font-size: 26px; margin-top: 30px">Добавьте первые товары</div><div style="font-size: 16px; line-height: 1.5; color: ${C.soft}; margin-top: 10px">Если товары уже есть в Excel или выгрузке из учётной программы — загрузите файл. Если нет — заведите вручную.</div></div>
<div style="width: 720px; margin: 32px auto 0; display: flex; gap: 12px; text-align: left">${choice(C.sun, P.import, "Загрузить Excel", "Сотни товаров за пару минут")}${choice("#E4DCFF", P.plus, "Добавить вручную", "Фото, название, размеры, количество")}</div>`)],
  ["Выбор → «Сменить категорию»", side("214") + main(deskHead("", TABS.map(([, n]) => n)) + card(bulkBar(3) + tableHead + ROWS.map((r, i) => deskRow(r, SEL3[i])).join("") + foot("Показано 7 из 214"))) + catMenu],
  ["После действия", side("214") + main(deskHead("", TABS.map(([, n]) => n)) + card(tableHead + ROWS.map((r, i) => deskRow(r, false, i < 3 ? { cat: "Кофты и футболки" } : {})).join("") + foot("Показано 7 из 214"))) + toast("3 товара перенесены в «Кофты и футболки»")],
  ["Поиск — ничего не нашлось", side("214") + main(deskHead("пуховик", TABS.map(([, n]) => n)) + emptyCard(emptyIcon(P.search, C.haze, C.ink), "Ничего не нашлось", "По запросу «пуховик» товаров нет. Ищем по названию, артикулу и штрихкоду.", btn("Сбросить поиск", "soft", "height: 48px; font-size: 15px")))],
  ["Загрузка", side("214") + main(deskHead("", ["…", "…", "…", "…"]).replace(/>…</g, `><span style="width: 14px; height: 8px; border-radius: 4px; background: #DCD8EE"></span><`) + card(tableHead + SKEL.map(([a, b]) => `<div style="display: grid; ${GRID}; align-items: center; padding: 10px 18px; border-top: 1px solid #F0EEF7">${box(false)}<span style="width: 48px; height: 48px; border-radius: 12px; background: ${C.haze}"></span><div><div style="width: ${a}px; height: 14px; border-radius: 7px; background: ${C.haze}"></div><div style="width: ${b - 30}px; height: 12px; border-radius: 6px; background: #F3F2FA; margin-top: 8px"></div></div>${[90, 70, 70, 50].map((w) => `<div style="width: ${w}px; height: 14px; border-radius: 7px; background: ${C.haze}"></div>`).join("")}<span style="width: 46px; height: 28px; border-radius: 999px; background: ${C.haze}"></span></div>`).join("")))],
];

const COLW = 430;
const phoneRow0 = PH.map(([t, b], i) => `<div style="position: absolute; left: ${i * COLW + 40}px; top: 40px"><div style="font-weight: 700; font-size: 17px; margin: 0 0 14px 4px">${i + 1}. ${t}</div><div style="position: relative; width: 390px; height: 844px; border-radius: 40px; overflow: hidden; background: ${C.paper}; box-shadow: 0 24px 60px rgba(40,20,110,.14)">${b}</div></div>`).join("\n");
const FW = 1440, FH = 900, GAP = 120, Y1 = 40 + 30 + 844 + 80, PER = 3;
const deskRows = DK.map(([t, b], i) => `<div style="position: absolute; left: ${40 + (i % PER) * (FW + GAP)}px; top: ${Y1 + Math.floor(i / PER) * (FH + 120)}px"><div style="font-weight: 700; font-size: 22px; margin: 0 0 18px 4px">${PH.length + i + 1}. ${t}</div><div style="position: relative; width: ${FW}px; height: ${FH}px; border-radius: 24px; overflow: hidden; background: ${C.paper}; box-shadow: 0 24px 60px rgba(40,20,110,.12)">${b}</div></div>`).join("\n");
const W = 40 + PER * (FW + GAP), H = Y1 + Math.ceil(DK.length / PER) * (FH + 120) + 20;
fs.writeFileSync(process.argv[2], page("Админка — товары: состояния", W, H, phoneRow0 + "\n" + deskRows));
console.log("size", W, H);
