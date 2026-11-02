// Генерирует AdminDesk.dc.html — ключевые экраны админки на компьютере (4 экрана 1440×900)
const fs = require("fs");
const { img, sv, P, C, pill, dot, btn, field, syncNote, toggle, thumb, noPhoto, page } = require("./admin-common.cjs");

const NAV = [["products", "Товары", "214"], ["import", "Импорт"], ["shop", "Магазин"]];
const side = (active) => `<div style="position: absolute; left: 0; top: 0; bottom: 0; width: 248px; padding: 22px 16px; box-sizing: border-box; background: ${C.lilac}; display: flex; flex-direction: column">
<div style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 20px; background: rgba(255,255,255,.55)"><span style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center">АK</span><div><div style="font-weight: 700; font-size: 15px">Айгерим Kids</div><div style="display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: ${C.inS}">${dot(C.inS)}Опубликован</div></div></div>
<div style="display: flex; flex-direction: column; gap: 4px; margin-top: 22px">${NAV.map(([k, l, n]) => { const on = k === active; return `<div style="display: flex; align-items: center; gap: 12px; height: 48px; padding: 0 14px; border-radius: 16px; font-size: 15px; font-weight: ${on ? 700 : 600}; ${on ? "background: #ffffff; box-shadow: 0 3px 0 rgba(90,70,190,.25)" : ""}">${sv(P[k], C.ink, 20, on ? 2.2 : 1.8)}<span style="flex: 1">${l}</span>${n ? `<span style="min-width: 22px; height: 22px; padding: 0 7px; box-sizing: border-box; border-radius: 999px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; ${k === "orders" ? `background: ${C.coral}; color: #ffffff` : "background: rgba(255,255,255,.6)"}">${n}</span>` : ""}</div>`; }).join("")}</div>
<span style="flex: 1"></span>
<div style="padding: 14px; border-radius: 20px; background: rgba(255,255,255,.55); font-size: 13px"><div style="font-weight: 600; color: ${C.quiet}">Ваша витрина</div><div style="font-weight: 700; margin-top: 2px">aigerim-kids.[сервис].kz</div><div style="display: flex; gap: 6px; margin-top: 10px"><span style="flex: 1; height: 36px; border-radius: 12px; background: ${C.ink}; color: #ffffff; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px">${sv(P.ext, "#ffffff", 14)}Открыть</span><span style="width: 36px; height: 36px; border-radius: 12px; background: #ffffff; display: flex; align-items: center; justify-content: center">${sv(P.copy, C.ink, 16)}</span></div></div>
</div>`;
const main = (inner) => `<div style="position: absolute; left: 248px; top: 0; right: 0; bottom: 0; background: ${C.paper}">${inner}</div>`;
const h1 = (t, right = "") => `<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px"><div style="font-weight: 800; font-size: 30px; letter-spacing: -0.03em">${t}</div><div style="display: flex; gap: 10px; align-items: center">${right}</div></div>`;
const tabs = (items) => `<div style="display: flex; gap: 8px">${items.map(([l, on, n]) => `<span style="height: 38px; padding: 0 14px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; font-size: 14px; background: ${on ? C.ink : C.haze}; color: ${on ? "#ffffff" : C.ink}">${l}${n ? `<span style="min-width: 20px; height: 20px; padding: 0 6px; box-sizing: border-box; border-radius: 999px; background: ${on ? C.sun : "#ffffff"}; color: ${C.ink}; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center">${n}</span>` : ""}</span>`).join("")}</div>`;
const search = (t, w = "100%") => `<div style="width: ${w}; display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 14px; box-sizing: border-box; border-radius: 14px; background: ${C.haze}; color: ${C.muted}; font-size: 14px">${sv(P.search, C.muted, 17)}${t}</div>`;
const smallBtn = (t, kind = "line") => btn(t, kind, "height: 44px; font-size: 14px; padding: 0 18px");
const S = [];

// 1. Заказы: список + карточка
const stNew = pill(dot(C.violet) + "Новый", "#ECE9FF", C.violet);
const orow = (no, when, thumbs, sum, st, on, bar) => `<div style="display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 20px; ${on ? `background: #ffffff; box-shadow: 0 0 0 2px ${C.ink}` : "background: #ffffff; box-shadow: 0 1px 0 " + C.line}; ${bar ? `border-left: 4px solid ${bar}` : ""}"><div style="flex: 1"><div style="display: flex; align-items: center; gap: 8px"><span style="font-weight: 800; font-size: 16px">№${no}</span>${st}</div><div style="font-size: 13px; color: ${C.quiet}; margin-top: 4px">${when}</div></div><div style="display: flex">${thumbs.map((k, i) => thumb(k, 36, 10, i ? "margin-left: -8px; box-shadow: 0 0 0 2px #ffffff" : "")).join("")}</div><div style="width: 86px; text-align: right; font-weight: 800; font-size: 15px; font-variant-numeric: tabular-nums">${sum}</div></div>`;
const tline = (k, name, v, price, qty, stock, warn) => `<div style="display: grid; grid-template-columns: 1fr 120px 130px 150px 110px; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid #F0EEF7; font-size: 14px"><div style="display: flex; align-items: center; gap: 12px">${thumb(k, 48, 12)}<div><div style="font-weight: 600">${name}</div><div style="font-size: 13px; color: ${C.quiet}">${v}</div></div></div><span style="font-variant-numeric: tabular-nums">${price}</span><span style="display: inline-flex; align-items: center; gap: 2px; width: fit-content; border-radius: 999px; background: #F1EFFA; padding: 3px"><span style="width: 28px; height: 28px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700">−</span><span style="min-width: 22px; text-align: center; font-weight: 700">${qty}</span><span style="width: 28px; height: 28px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700">+</span></span><span style="font-weight: 700; font-size: 13px; color: ${warn ? C.coral : C.inS}">${stock}</span><span style="text-align: right; font-weight: 800; font-variant-numeric: tabular-nums">${price}</span></div>`;
S.push(["Заказы — список и карточка", side("orders") + main(`<div style="position: absolute; left: 0; top: 0; bottom: 0; width: 460px; padding: 28px 24px; box-sizing: border-box; border-right: 1px solid ${C.line}">
${h1("Заказы")}<div style="margin-top: 16px">${tabs([["Новые", true, "3"], ["Подтверждённые", false, "5"], ["Выданные"], ["Отменённые"]])}</div>
<div style="margin-top: 14px">${search("Номер заказа или товар")}</div>
<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 14px">
${orow(128, "Сегодня, 14:32 · 3 позиции", ["jacket", "sneakers", "beanie"], "37 300 ₸", stNew, true, C.violet)}
${orow(127, "Сегодня, 11:05 · 1 позиция", ["dressR"], "9 500 ₸", stNew, false, C.violet)}
${orow(121, "28 окт, 18:40 · 2 позиции", ["hoodie", "tshirt"], "12 400 ₸", pill(dot("#E8A100") + "Ждёт 3 дня", "#FFF1D6", "#7A4300"), false, "#E8A100")}
</div></div>
<div style="position: absolute; left: 460px; top: 0; right: 0; bottom: 0; padding: 28px 32px; box-sizing: border-box">
<div style="display: flex; align-items: flex-start; justify-content: space-between"><div><div style="display: flex; align-items: center; gap: 10px"><span style="font-weight: 800; font-size: 28px; letter-spacing: -0.03em">Заказ №128</span>${stNew}</div><div style="font-size: 14px; color: ${C.quiet}; margin-top: 4px">Сегодня, 14:32 · пришёл с витрины</div></div>
<div style="display: flex; gap: 10px">${smallBtn("Отменить", "soft")}${btn(sv(P.check, C.mintInk, 18, 2.6) + "Подтвердить и списать", "mint", "height: 44px; font-size: 14px")}</div></div>
<div style="margin-top: 22px; padding: 6px 20px 14px; border-radius: 24px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}, 0 6px 16px rgba(40,30,110,.05)">
<div style="display: grid; grid-template-columns: 1fr 120px 130px 150px 110px; gap: 12px; padding: 12px 0 8px; font-size: 12px; font-weight: 600; color: ${C.quiet}"><span>Товар</span><span>Цена</span><span>Кол-во</span><span>Остаток</span><span style="text-align: right">Сумма</span></div>
${tline("jacket", "Куртка демисезонная", "Рост 110 · арт. KD-110", "18 900 ₸", 1, "На складе 3", false)}
${tline("sneakers", "Кроссовки на липучках", "Размер 27 · арт. SN-27", "14 200 ₸", 1, "0 — не хватает 1", true)}
${tline("beanie", "Шапка вязаная", "Один размер · арт. SH-01", "4 200 ₸", 1, "На складе 14", false)}
<div style="display: flex; justify-content: flex-end; gap: 24px; align-items: baseline; padding-top: 12px; border-top: 1px solid #F0EEF7"><span style="color: ${C.soft}">Итого</span><span style="font-weight: 800; font-size: 22px; font-variant-numeric: tabular-nums">37 300 ₸</span></div></div>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px">
<div style="padding: 16px 18px; border-radius: 22px; background: #FFF8E1"><div style="font-size: 13px; font-weight: 600; color: ${C.quiet}">Комментарий покупателя</div><div style="margin-top: 6px; font-size: 15px; line-height: 1.45">Можно примерить куртку в субботу?</div></div>
${field("Заметка для себя", '<span style="color: ' + C.muted + '">Телефон покупателя, договорённости…</span>')}</div>
<div style="margin-top: 16px; display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 16px; background: #FFE9E1; color: #8A2E12; font-size: 14px; font-weight: 600">${sv(P.warn, C.coral, 18, 2.2)}Кроссовок 27 размера по учёту нет. Подтвердить можно — остаток станет 0.</div>
</div>`)]);

// 2. Товары — таблица
const cb = (on) => `<span style="width: 20px; height: 20px; border-radius: 6px; flex: none; display: inline-flex; align-items: center; justify-content: center; ${on ? `background: ${C.ink}` : "border: 1.5px solid #C9C3E3; background: #ffffff"}">${on ? sv(P.check, "#ffffff", 14, 3) : ""}</span>`;
const COLS = "40px 64px 1fr 150px 110px 120px 120px 90px";
const trow = (sel, k, name, art, cat, vars, price, stock, vis, tag) => `<div style="display: grid; grid-template-columns: ${COLS}; align-items: center; gap: 12px; padding: 10px 18px; border-top: 1px solid #F0EEF7; font-size: 14px; ${sel ? "background: #F4F1FF" : ""}">${cb(sel)}${k ? thumb(k, 48, 12) : noPhoto(48, 12)}<div style="min-width: 0"><div style="font-weight: 600">${name}</div><div style="font-size: 12px; color: ${C.quiet}">арт. ${art}${tag ? " · " + tag : ""}</div></div><span>${cat}</span><span style="color: ${C.quiet}">${vars}</span><span style="font-weight: 700; font-variant-numeric: tabular-nums">${price}</span><span style="font-weight: 600; color: ${stock[1]}">${stock[0]}</span>${toggle(vis)}</div>`;
S.push(["Товары — таблица и массовые действия", side("products") + main(`<div style="padding: 28px 32px">
${h1("Товары", smallBtn(sv(P.import, C.ink, 18) + "Загрузить Excel") + btn(sv(P.plus, "#ffffff", 18, 2.4) + "Товар", "dark", "height: 44px; font-size: 14px"))}
<div style="display: flex; align-items: center; gap: 12px; margin-top: 18px">${search("Название, артикул, штрихкод", "360px")}${tabs([["Все", true, "214"], ["Без фото", false, "37"], ["Нет в наличии", false, "12"], ["Скрытые", false, "4"]])}<span style="flex: 1"></span><span style="height: 40px; display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; border: 1.5px solid #DAD6EC; border-radius: 999px; background: #ffffff; font-weight: 600; font-size: 14px">Все категории ${sv(P.down, C.quiet, 15, 2.4)}</span></div>
<div style="margin-top: 16px; border-radius: 24px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}, 0 6px 16px rgba(40,30,110,.05); overflow: hidden">
<div style="display: flex; align-items: center; gap: 14px; padding: 12px 18px; background: ${C.ink}; color: #ffffff; font-size: 14px; font-weight: 600">${cb(true).replace(C.ink, C.sun).replace("#ffffff", C.ink)}Выбрано 3<span style="flex: 1"></span><span style="padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,.14)">Скрыть</span><span style="padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,.14)">Показать</span><span style="padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,.14)">Сменить категорию</span><span style="opacity: .7">Снять выбор</span></div>
<div style="display: grid; grid-template-columns: ${COLS}; gap: 12px; padding: 12px 18px; font-size: 12px; font-weight: 600; color: ${C.quiet}"><span></span><span>Фото</span><span>Название</span><span>Категория</span><span>Варианты</span><span>Цена</span><span>Остаток</span><span>Витрина</span></div>
${trow(true, "jacket", "Куртка демисезонная", "KD-1001", "Куртки", "7 вариантов", "18 900 ₸", ["24 шт.", C.inS], true)}
${trow(true, null, "Комбинезон зимний", "KM-2210", "Куртки", "6 вариантов", "29 500 ₸", ["11 шт.", C.inS], true, "без фото")}
${trow(true, "raincoat", "Дождевик жёлтый", "DZ-0412", "Куртки", "5 вариантов", "7 900 ₸", ["9 шт.", C.inS], true)}
${trow(false, "sneakers", "Кроссовки на липучках", "SN-0027", "Обувь", "8 вариантов", "14 200 ₸", ["мало: 3", C.lowS], true)}
${trow(false, "coat", "Пальто шерстяное", "PL-3001", "Куртки", "7 вариантов", "24 900 ₸", ["нет", C.outS], false)}
${trow(false, "dressY", "Платье летнее", "PT-0815", "Платья", "6 вариантов", "8 200 ₸", ["4 шт.", C.inS], true)}
${trow(false, null, "Варежки детские", "VR-0101", "Шапки", "1 вариант", "2 900 ₸", ["30 шт.", C.inS], true, "без фото")}
<div style="display: flex; justify-content: space-between; padding: 14px 18px; border-top: 1px solid #F0EEF7; font-size: 13px; color: ${C.quiet}"><span>Показано 7 из 214</span><span>Подгружаются при прокрутке</span></div>
</div></div>`)]);

// 3. Карточка товара
const vh = "110px 1fr 140px 120px 170px 40px";
const vr = (art, h, price, st, bar, head) => `<div style="display: grid; grid-template-columns: ${vh}; align-items: center; gap: 12px; padding: ${head ? "12px 18px 8px" : "8px 18px"}; ${head ? `font-size: 12px; font-weight: 600; color: ${C.quiet}` : "border-top: 1px solid #F0EEF7; font-size: 14px"}; font-variant-numeric: tabular-nums">${head ? `<span>Артикул</span><span>Рост</span><span>Цена</span><span>Остаток</span><span>Штрихкод</span><span></span>` : `<span style="color: ${C.quiet}">${art}</span><span style="font-weight: 600">${h}</span><span style="padding: 8px 10px; border-radius: 10px; border: 1.5px solid #E2DFF0">${price}</span><span style="padding: 8px 10px; border-radius: 10px; border: 1.5px solid #E2DFF0; ${st === "0" ? "color: " + C.outS : ""}">${st}</span><span style="color: ${C.quiet}">${bar}</span>${sv(P.x, C.muted, 16)}`}</div>`;
S.push(["Карточка товара — редактирование", side("products") + main(`<div style="padding: 24px 32px">
<div style="font-size: 14px; color: ${C.quiet}">Товары / Куртки</div>
<div style="margin-top: 6px">${h1("Куртка демисезонная", `<span style="font-weight: 600; font-size: 14px; color: ${C.violet}; display: inline-flex; align-items: center; gap: 6px">${sv(P.eye, C.violet, 16)}На витрине</span>` + smallBtn("Отменить", "soft") + btn("Сохранить", "dark", "height: 44px; font-size: 14px"))}</div>
<div style="display: flex; gap: 28px; margin-top: 18px">
<div style="width: 420px; flex: none"><div style="position: relative">${thumb("jacket", 420, 24)}<span style="position: absolute; left: 12px; top: 12px">${pill("Обложка", "rgba(255,255,255,.92)", C.ink)}</span></div>
<div style="display: flex; gap: 8px; margin-top: 8px">${thumb("jacket2", 98, 16, "box-shadow: 0 0 0 2px " + C.ink)}<span style="width: 98px; height: 98px; border-radius: 16px; border: 1.5px dashed #C9C3E3; background: #F6F5FB; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 12px; font-weight: 600; color: ${C.quiet}">${sv(P.plus, C.quiet, 20)}Добавить</span></div>
<div style="font-size: 12px; color: ${C.muted}; margin-top: 8px">Перетащите фото сюда или поменяйте порядок. До 10 фото.</div></div>
<div style="flex: 1; display: flex; flex-direction: column; gap: 14px">
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">${field("Название", "Куртка демисезонная", syncNote)}${field("Категория", "Куртки", syncNote)}</div>
${field("Описание", "Лёгкая куртка на весну и осень, утеплитель 100 г. Капюшон отстёгивается, манжеты на резинке.", '<span style="color: ' + C.muted + '">правится только здесь</span>', "")}
<div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 16px; background: #ffffff; border: 1.5px solid #E2DFF0"><div><div style="font-weight: 600; font-size: 15px">Показывать на витрине</div><div style="font-size: 12px; color: ${C.muted}">Скрытый товар виден только вам</div></div>${toggle(true)}</div>
<div style="display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 16px; background: #ECE9FF; font-size: 13px; line-height: 1.45; color: #2A2290">${sv(P.sync, C.violet, 16, 2.2)}<span>Поля с пометкой «из Excel» обновятся при следующем импорте. Фото, описание и видимость импорт не трогает.</span></div>
<div style="border-radius: 20px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}, 0 6px 16px rgba(40,30,110,.05); overflow: hidden">
<div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px 0"><span style="font-weight: 700; font-size: 15px">Варианты · 7</span><span style="display: flex; gap: 14px; font-size: 13px">${syncNote}<span style="font-weight: 600; color: ${C.violet}">+ Вариант</span></span></div>
${vr("", "", "", "", "", true)}${vr("KD-104", "104", "18 900 ₸", "6", "4870001234104")}${vr("KD-110", "110", "18 900 ₸", "3", "4870001234110")}${vr("KD-116", "116", "18 900 ₸", "0", "4870001234116")}${vr("KD-122", "122", "19 500 ₸", "8", "4870001234122")}
</div></div></div></div>`)]);

// 4. Импорт — сопоставление колонок (выгрузка из учётной системы)
const stp = (n, l, st) => `<div style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: ${st === "todo" ? C.muted : C.ink}"><span style="width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; ${st === "done" ? `background: ${C.mint}` : st === "now" ? `background: ${C.ink}; color: #ffffff` : `background: ${C.haze}`}">${st === "done" ? sv(P.check, C.mintInk, 15, 3) : n}</span>${l}</div>`;
const sel = (t, kind) => `<span style="height: 40px; display: inline-flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 12px; box-sizing: border-box; border-radius: 12px; font-size: 14px; font-weight: 600; ${kind === "skip" ? `background: #F6F5FB; color: ${C.muted}; border: 1.5px dashed #D6D2E8` : kind === "attr" ? `background: #ECE9FF; color: #2A2290; border: 1.5px solid #CFC8FF` : `background: #ffffff; border: 1.5px solid #E2DFF0`}">${t}${sv(P.down, C.quiet, 15, 2.4)}</span>`;
const mrow = (col, sample, target, kind, req) => `<div style="display: grid; grid-template-columns: 1fr 1fr 40px 1.1fr; align-items: center; gap: 12px; padding: 10px 18px; border-top: 1px solid #F0EEF7; font-size: 14px"><span style="font-weight: 600">${col}</span><span style="color: ${C.quiet}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${sample}</span><span style="color: ${C.muted}">→</span><span style="display: flex; align-items: center; gap: 8px">${sel(target, kind)}${req ? `<span style="font-size: 12px; color: ${C.inS}; font-weight: 700">обязательно ✓</span>` : ""}</span></div>`;
S.push(["Импорт — сопоставление колонок", side("import") + main(`<div style="padding: 28px 32px">
${h1("Импорт товаров", `<span style="font-weight: 600; font-size: 14px; color: ${C.violet}">История импортов</span>` + `<span style="font-weight: 600; font-size: 14px; color: ${C.violet}">Скачать шаблон</span>`)}
<div style="display: flex; align-items: center; gap: 18px; margin-top: 18px">${stp(1, "Файл", "done")}<span style="width: 40px; height: 2px; background: ${C.mint}"></span>${stp(2, "Колонки", "now")}<span style="width: 40px; height: 2px; background: ${C.haze}"></span>${stp(3, "Проверка", "todo")}<span style="width: 40px; height: 2px; background: ${C.haze}"></span>${stp(4, "Готово", "todo")}</div>
<div style="display: flex; gap: 24px; margin-top: 22px">
<div style="flex: 1; border-radius: 24px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}, 0 6px 16px rgba(40,30,110,.05); overflow: hidden">
<div style="display: flex; align-items: center; gap: 10px; padding: 16px 18px">${sv(P.file, C.inS, 22)}<div style="flex: 1"><div style="font-weight: 700; font-size: 15px">vygruzka_1c_31-10.xlsx</div><div style="font-size: 13px; color: ${C.quiet}">218 строк · заголовки не совпали с шаблоном — укажите, что где</div></div></div>
<div style="display: grid; grid-template-columns: 1fr 1fr 40px 1.1fr; gap: 12px; padding: 8px 18px; font-size: 12px; font-weight: 600; color: ${C.quiet}"><span>Колонка в файле</span><span>Пример</span><span></span><span>Куда загрузить</span></div>
${mrow("Код", "KD-110", "Артикул", "", true)}
${mrow("Номенклатура", "Куртка демисезонная", "Название", "", true)}
${mrow("Цена розничная", "18900,00", "Цена", "", true)}
${mrow("Количество", "3", "Остаток", "", true)}
${mrow("Группа", "Детская / Куртки", "Категория", "")}
${mrow("Размер", "110", "Атрибут «Рост»", "attr")}
${mrow("Штрихкод", "4870001234110", "Штрихкод", "")}
${mrow("Ед. изм.", "шт", "Не загружать", "skip")}
</div>
<div style="width: 340px; flex: none; display: flex; flex-direction: column; gap: 14px">
<div style="padding: 18px; border-radius: 24px; background: #E6FBF2; color: ${C.mintInk}"><div style="font-weight: 800; font-size: 17px">Все обязательные поля найдены</div><div style="font-size: 14px; line-height: 1.5; margin-top: 6px">Артикул, название, цена и остаток. Можно переходить к проверке.</div></div>
<div style="padding: 18px; border-radius: 24px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}; font-size: 14px; line-height: 1.5; color: ${C.soft}"><div style="font-weight: 700; color: ${C.ink}">Запомним это сопоставление</div>В следующий раз файл из 1С загрузится сразу, без этого шага.</div>
<div style="padding: 18px; border-radius: 24px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}; font-size: 14px; line-height: 1.5; color: ${C.soft}"><div style="font-weight: 700; color: ${C.ink}">Новая колонка — новый атрибут</div>«Размер» станет атрибутом «Рост»: по нему покупатели фильтруют на витрине.</div>
<span style="flex: 1"></span>
${btn("Дальше: проверка →", "sun", "width: 100%")}
</div></div></div>`)]);

// Заказы в админке не храним (D14)
S.shift();
const FW = 1440, FH = 900, GAP = 120, LAB = 50;
const body = S.map(([t, b], i) => {
  const x = i * (FW + GAP) + 60, y = 60;
  return `<div style="position: absolute; left: ${x}px; top: ${y}px"><div style="font-weight: 700; font-size: 22px; margin: 0 0 18px 4px">${i + 1}. ${t}</div><div style="position: relative; width: ${FW}px; height: ${FH}px; border-radius: 24px; overflow: hidden; background: ${C.paper}; box-shadow: 0 24px 60px rgba(40,20,110,.12)">${b}</div></div>`;
}).join("\n");
const W = S.length * (FW + GAP) + 0, H = FH + LAB + 2 * 60 + 18;
fs.writeFileSync(process.argv[2], page("Админка — компьютер", W, H, body));
console.log("size", W, H);
