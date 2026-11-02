// Корзина: убрать товар и поменять количество (задача основателя 2026-11-02): на компьютере в выпадающей панели
// корзины убрать товар было нельзя. Основатель выбрал В — счётчик на компьютере и на телефоне, плюс комментарий
// для магазина в панели компьютера, как в шторке телефона.
//   node generators/gen-cart-remove.cjs boards/StoreCartRemove.dc.html boards/StoreCartRemoveVariants.dc.html
// Первый файл — утверждённый вариант, второй (необязательный) — невыбранные варианты для архива.
// Компьютер: А — крестик справа от суммы, Б — ссылка «Убрать» под вариантом, В — счётчик «− N +», как на
// телефоне (основатель: иначе два одинаковых товара не взять); на единице вместо «−» значок корзины — убрать.
// После удаления на месте строки плашка «… убрана · Вернуть» (несколько секунд) — на случай промаха.
// Телефон: как сейчас (− N +, на единице «−» убирает) и вариант с тем же крестиком вместо счётчика.
const fs = require("fs");
const [out, outArchive] = process.argv.slice(2);
const B = "/_blob/";

const ITEMS = [
  { name: "Куртка демисезонная", variant: "Рост 110", qty: 1, sum: "18 900 ₸", img: "1260977f2c0c34a5b933572bb6e99e94" },
  { name: "Платье трикотажное", variant: "Рост 110", qty: 2, sum: "19 000 ₸", img: "7d0f77b8370d9af612d61812d7452e5f" },
  { name: "Шапка вязаная", variant: "Один размер", qty: 1, sum: "4 200 ₸", img: "b7e066c9d74196dbd3a06f17035798be" }
];

const x = (s, c = "#3A3672") => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>`;
const removeBtn = (d) => `<span title="Убрать из корзины" style="width: ${d}px; height: ${d}px; flex: none; border-radius: 50%; background: #F1EFFA; display: flex; align-items: center; justify-content: center">${x(Math.round(d * 0.45))}</span>`;
const trash = (s) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#17133D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"></path><path d="M9 7V4.5h6V7"></path><path d="M6.5 7l1 12.5h9l1-12.5"></path></svg>`;
// «− N +»: на единице «−» становится корзиной — сразу видно, что нажатие уберёт товар
const counter = (q, d, f) => `<div style="flex: none; display: flex; align-items: center; gap: 2px; border-radius: 999px; background: #F1EFFA; padding: 3px"><span title="${q > 1 ? "Меньше" : "Убрать из корзины"}" style="width: ${d}px; height: ${d}px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: ${f}px">${q > 1 ? "−" : trash(Math.round(d * 0.5))}</span><span style="min-width: 22px; text-align: center; font-weight: 700; font-size: ${f - 2}px; font-variant-numeric: tabular-nums">${q}</span><span title="Больше" style="width: ${d}px; height: ${d}px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: ${f}px">+</span></div>`;
const thumb = (it, d, r) => `<img src="${B + it.img}" alt="" style="width: ${d}px; height: ${d}px; flex: none; border-radius: ${r}px; object-fit: cover; background: #EEECF8">`;
const undo = (it, r) => `<div style="display: flex; align-items: center; justify-content: space-between; height: 56px; padding: 0 14px; border-radius: ${r}px; background: #F6F5FB; font-size: 14px; color: #4A4580"><span style="min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">${it.name} — убрано</span><span style="flex: none; margin-left: 12px; font-weight: 700; color: #3B2FD9">Вернуть</span></div>`;

// компьютер
const deskRowA = (it) => `<div style="display: flex; gap: 12px; align-items: center">${thumb(it, 56, 14)}<div style="flex: 1; min-width: 0"><div style="font-weight: 600; font-size: 14px">${it.name}</div><div style="font-size: 13px; color: #4A4580">${it.variant} · ${it.qty} шт.</div></div><div style="font-weight: 800; font-size: 14px; font-variant-numeric: tabular-nums">${it.sum}</div>${removeBtn(30)}</div>`;
const deskRowB = (it) => `<div style="display: flex; gap: 12px; align-items: center">${thumb(it, 56, 14)}<div style="flex: 1; min-width: 0"><div style="font-weight: 600; font-size: 14px">${it.name}</div><div style="font-size: 13px; color: #4A4580">${it.variant} · ${it.qty} шт. · <span style="color: #3B2FD9; font-weight: 600; text-decoration: underline; text-underline-offset: 3px">Убрать</span></div></div><div style="font-weight: 800; font-size: 14px; font-variant-numeric: tabular-nums">${it.sum}</div></div>`;
const deskRowC = (it) => `<div style="display: flex; gap: 12px; align-items: center">${thumb(it, 56, 14)}<div style="flex: 1; min-width: 0"><div style="font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${it.name}</div><div style="font-size: 13px; color: #4A4580">${it.variant}</div><div style="font-weight: 800; font-size: 14px; margin-top: 1px; font-variant-numeric: tabular-nums">${it.sum}</div></div>${counter(it.qty, 30, 16)}</div>`;
const deskPanel = (rows, total) => `<div style="width: 400px; padding: 20px; box-sizing: border-box; border-radius: 26px; background: #ffffff; box-shadow: 0 24px 60px rgba(23,19,61,.18)">
<div style="font-weight: 800; font-size: 19px">Корзина</div>
<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px">${rows}</div>
<div style="margin-top: 14px; height: 44px; padding: 0 14px; display: flex; align-items: center; border-radius: 14px; background: #F6F5FB; color: #6B6694; font-size: 14px">Комментарий для магазина</div>
<div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 14px"><span style="font-size: 14px; color: #3A3672">Итого</span><span style="font-weight: 800; font-size: 20px; font-variant-numeric: tabular-nums">${total}</span></div>
<div style="margin-top: 12px; height: 52px; border-radius: 999px; background: #5EE6B0; color: #0B3A28; box-shadow: 0 4px 0 #26B985; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px">Заказать через WhatsApp</div>
</div>`;

// телефон
const stepper = (q) => `<div style="display: flex; align-items: center; gap: 2px; border-radius: 999px; background: #F1EFFA; padding: 3px"><span style="width: 34px; height: 34px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 17px">−</span><span style="min-width: 24px; text-align: center; font-weight: 700; font-size: 15px">${q}</span><span style="width: 34px; height: 34px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 17px">+</span></div>`;
const phoneRow = (it, right, withQty) => `<div style="display: flex; gap: 12px; align-items: center">${thumb(it, 64, 16)}<div style="flex: 1; min-width: 0"><div style="font-weight: 600; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${it.name}</div><div style="font-size: 13px; color: #4A4580">${it.variant}${withQty ? ` · ${it.qty} шт.` : ""}</div><div style="font-weight: 800; font-size: 15px; margin-top: 2px; font-variant-numeric: tabular-nums">${it.sum}</div></div>${right}</div>`;
const phoneSheet = (rows, total) => `<div style="width: 390px; height: 640px; position: relative; overflow: hidden; border-radius: 32px; background: rgba(23,19,61,.42)">
<div style="position: absolute; left: 0; right: 0; bottom: 0; background: #ffffff; border-radius: 28px 28px 0 0; padding: 10px 16px 24px">
<div style="width: 40px; height: 5px; border-radius: 999px; background: #DCD8EE; margin: 0 auto 14px"></div>
<div style="font-weight: 800; font-size: 20px">Корзина</div>
<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 14px">${rows}</div>
<div style="margin-top: 16px; height: 48px; padding: 0 14px; display: flex; align-items: center; border-radius: 16px; background: #F6F5FB; color: #6B6694; font-size: 15px">Комментарий для магазина</div>
<div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 18px"><span style="font-size: 15px; color: #3A3672">Итого</span><span style="font-weight: 800; font-size: 22px; font-variant-numeric: tabular-nums">${total}</span></div>
<div style="margin-top: 14px; height: 56px; border-radius: 999px; background: #5EE6B0; color: #0B3A28; box-shadow: 0 5px 0 #26B985; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px">Заказать через WhatsApp</div>
</div></div>`;

const [jacket, dress, beanie] = ITEMS;
const CHOSEN = [
  ["Компьютер — счётчик «− N +» и комментарий", "Можно взять два одинаковых и убрать товар. На единице «−» становится значком корзины — видно, что нажатие уберёт товар. После удаления — «Вернуть» на несколько секунд.", [
    ["Корзина", deskPanel(ITEMS.map(deskRowC).join(""), "42 100 ₸")],
    ["Сразу после «корзины» у куртки", deskPanel(undo(jacket, 14) + deskRowC(dress) + deskRowC(beanie), "23 200 ₸")]
  ]],
  ["Телефон — тот же счётчик", "Как на компьютере: на единице вместо «−» значок корзины.", [
    ["Корзина", phoneSheet(ITEMS.map((it) => phoneRow(it, counter(it.qty, 34, 17))).join(""), "42 100 ₸")],
    ["Сразу после «корзины» у куртки", phoneSheet(undo(jacket, 16) + phoneRow(dress, counter(dress.qty, 34, 17)) + phoneRow(beanie, counter(beanie.qty, 34, 17)), "23 200 ₸")]
  ]]
];
const VARIANTS = [
  ["Компьютер — А. Крестик справа", "Видно сразу у каждой строки, одно нажатие. Количество не меняется — только убрать.", [
    ["Корзина", deskPanel(ITEMS.map(deskRowA).join(""), "42 100 ₸")],
    ["Сразу после «×»", deskPanel(undo(jacket, 14) + deskRowA(dress) + deskRowA(beanie), "23 200 ₸")]
  ]],
  ["Компьютер — Б. Ссылка «Убрать»", "Тише крестика, читается словами, но мелкая цель для мыши.", [
    ["Корзина", deskPanel(ITEMS.map(deskRowB).join(""), "42 100 ₸")]
  ]],
  ["Телефон — как сейчас", "− N +; на единице «−» убирает товар.", [
    ["Корзина", phoneSheet(ITEMS.map((it) => phoneRow(it, stepper(it.qty))).join(""), "42 100 ₸")]
  ]],
  ["Телефон — тот же крестик", "Как на компьютере: количество в строке «Рост 110 · 2 шт.», справа «×».", [
    ["Корзина", phoneSheet(ITEMS.map((it) => phoneRow(it, removeBtn(36), true)).join(""), "42 100 ₸")],
    ["Сразу после «×»", phoneSheet(undo(jacket, 16) + phoneRow(dress, removeBtn(36), true) + phoneRow(beanie, removeBtn(36), true), "23 200 ₸")]
  ]]
];

const COL = 440, GAP_Y = 120;
function board(GROUPS, name) {
let y = 60;
const blocks = GROUPS.map(([title, note, frames]) => {
  const h = Math.max(...frames.map(([, body]) => (body.includes("width: 390px") ? 640 : 480)));
  const html = `<div style="position: absolute; left: 60px; top: ${y}px">
<div style="font-weight: 800; font-size: 24px">${title}</div>
<div style="margin-top: 6px; font-size: 15px; color: #3A3672">${note}</div>
<div style="display: flex; gap: 40px; margin-top: 18px">${frames.map(([label, body]) => `<div><div style="margin: 0 0 10px 6px; font-weight: 700; font-size: 14px; color: #4A4580">${label}</div>${body}</div>`).join("")}</div>
</div>`;
  y += 90 + 30 + h + GAP_Y;
  return html;
}).join("\n");
const W = 60 + 2 * COL + 40 + 60, H = y;
const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${name}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Geologica:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:#F1F0F7}
</style>
</helmet>
<div style="width: ${W}px; height: ${H}px; position: relative; overflow: hidden; font-family: 'Geologica', system-ui, sans-serif; color: #17133D; background: #F1F0F7">
${blocks}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${W},"height":${H}}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`;
console.log(W, H, html.length);
return html;
}

fs.writeFileSync(out, board(CHOSEN, "Витрина V6 — корзина: количество и удаление"));
if (outArchive) fs.writeFileSync(outArchive, board(VARIANTS, "Витрина V6 — корзина: невыбранные варианты"));
