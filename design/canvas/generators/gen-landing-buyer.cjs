// Генерирует LandingBuyerPhone.dc.html — варианты телефона покупателя в примере на лендинге (макет N).
// Задача (основатель, 2026-11-02): экран похож на настоящую витрину — шапка магазина, сетка товаров,
// товар выбирается нажатием, внизу кнопка заказа; дальше всё как сейчас (WhatsApp магазина не меняется).
// У каждого варианта два состояния: пусто и выбрано 2 товара.
//   node generators/gen-landing-buyer.cjs boards/LandingBuyerPhone.dc.html
const fs = require("fs");
const out = process.argv[2];
const B = "/_blob/";

const PRODUCTS = [
  { name: "Куртка демисезонная", price: "18 900 ₸", low: true, c: ["#9C90FF", "#3B2FD9"], img: "1260977f2c0c34a5b933572bb6e99e94" },
  { name: "Платье трикотажное", price: "9 500 ₸", c: ["#FFC3DD", "#E2508F"], img: "7d0f77b8370d9af612d61812d7452e5f" },
  { name: "Кроссовки", price: "14 200 ₸", low: true, c: ["#FFE19A", "#F0A22C"], img: "04a201bc58d35022516d4467e49b7f41" },
  { name: "Шапка вязаная", price: "4 200 ₸", c: ["#B8FFE1", "#26B985"], img: "b7e066c9d74196dbd3a06f17035798be" },
  { name: "Худи с капюшоном", price: "8 900 ₸", c: ["#C9BBFF", "#7C6CFF"], img: "b10ce1436e13380c548fa804ef4347fd" },
  { name: "Платье летнее", price: "8 200 ₸", c: ["#FFF0A8", "#E3AE00"], img: "7cb5296df170d7a0aca0d4bd8ec7cb9e" },
  { name: "Дождевик", price: "7 900 ₸", c: ["#FFD0BF", "#FF7A59"], img: "a3bc2f157acffb785bd68c64b69fa957" },
  { name: "Джинсовка", price: "12 500 ₸", c: ["#BFD3FF", "#3B6FD9"], img: "8a58a9934844266efb16a8c4761e7f7b" },
  { name: "Кардиган", price: "10 400 ₸", c: ["#E4DCFF", "#9A95B8"], img: "93fc374092f690eb46aa0b0cf74bcce4" },
  { name: "Футболка", price: "3 500 ₸", c: ["#FFFFFF", "#DAD6EC"], img: "167257d6a7f8ad684c2d856ae3a11150" },
  { name: "Пальто шерстяное", price: "24 900 ₸", c: ["#FFE7F1", "#FF9CC8"], img: "4425d713fea616a795f8125f90d8aed0" },
  { name: "Платье в цветок", price: "9 900 ₸", c: ["#D4F6E7", "#5EE6B0"], img: "ed10ba6d31f748a438a21db8a7387c8a" }
];
// выбрано: платье ×2 и шапка ×1 — 23 200 ₸, как в примере сейчас
const PICKED = { 1: 2, 3: 1 };
const TOTAL = "23 200 ₸";

const ph = (p, photos) => (photos
  ? `background: #EEECF8 url(${B + p.img}) center / cover`
  : `background: radial-gradient(120% 120% at 30% 20%, ${p.c[0]}, ${p.c[1]})`);
const priceChip = (p, s) => `<span style="position: absolute; left: 6px; bottom: 6px; padding: ${s ? "3px 7px" : "4px 9px"}; border-radius: 999px; background: rgba(255,255,255,.92); font-weight: 700; font-size: ${s ? 11 : 13}px; font-variant-numeric: tabular-nums">${p.price}</span>`;
const lowChip = (s) => `<span style="position: absolute; top: 6px; right: 6px; padding: ${s ? "2px 6px" : "3px 8px"}; border-radius: 999px; background: #FFF1D6; color: #7A4300; font-weight: 700; font-size: ${s ? 9 : 10}px">мало</span>`;
const count = (q, s) => `<span style="position: absolute; top: 6px; left: 6px; width: ${s ? 24 : 30}px; height: ${s ? 24 : 30}px; border-radius: 50%; background: #FFD23F; color: #17133D; box-shadow: 0 3px 0 #C79A00; font-weight: 800; font-size: ${s ? 13 : 15}px; display: flex; align-items: center; justify-content: center">${q}</span>`;
const plus = (q) => `<span style="position: absolute; right: 6px; bottom: 6px; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 17px; ${q ? "background: #FFD23F; color: #17133D; box-shadow: 0 3px 0 #C79A00" : "background: #17133D; color: #ffffff; box-shadow: 0 3px 0 #0B0A26"}">${q || "+"}</span>`;

// шапка витрины в миниатюре: магазин, WhatsApp, поиск, категории
const header = (compact) => `<div style="background: #FBFAFF; border-bottom: 1px solid #ECEAF5">
<div style="display: flex; align-items: center; gap: 9px; padding: 16px 14px 0">
<span style="width: 34px; height: 34px; flex: none; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 12px; display: flex; align-items: center; justify-content: center">АK</span>
<div style="flex: 1; min-width: 0"><div style="font-weight: 800; font-size: 14px">Айгерим Kids ›</div><div style="font-size: 11px; color: #4A4580">ТЦ «Мега» · <span style="color: #157A52; font-weight: 600">Открыто</span></div></div>
<span style="width: 34px; height: 34px; border-radius: 50%; background: #5EE6B0; box-shadow: 0 3px 0 #26B985"></span>
</div>
${compact ? "" : `<div style="padding: 10px 14px 0"><div style="height: 36px; border-radius: 14px; background: #EEECF8; display: flex; align-items: center; padding: 0 12px; color: #6B6694; font-size: 13px">Поиск по магазину</div></div>`}
<div style="display: flex; gap: 6px; padding: 10px 14px; overflow: hidden">${["Все", "Рост 110", "Куртки", "Платья"].map((c, i) => `<span style="flex: none; height: 30px; padding: 0 12px; border-radius: 999px; display: inline-flex; align-items: center; font-weight: 600; font-size: 12px; background: ${i === 0 ? "#17133D" : i === 1 ? "#E9E5FF" : "#EEECF8"}; color: ${i === 0 ? "#ffffff" : i === 1 ? "#3B2FD9" : "#17133D"}">${c}</span>`).join("")}</div>
</div>`;

const mintButton = (picked) => `<div style="position: absolute; left: 12px; right: 12px; bottom: 12px">${picked
  ? `<div style="height: 52px; border-radius: 999px; background: #5EE6B0; color: #0B3A28; box-shadow: 0 5px 0 #26B985; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px">Заказать через WhatsApp · ${TOTAL}</div>`
  : `<div style="height: 52px; border-radius: 999px; background: #EEECF8; color: #6B6694; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px">Нажмите на товар, чтобы выбрать</div>`}</div>`;
// плашка корзины, как на витрине: тёмная, количество и сумма, справа — «В WhatsApp»
const cartPill = (picked) => `<div style="position: absolute; left: 12px; right: 12px; bottom: 14px">${picked
  ? `<div style="display: flex; align-items: center; gap: 10px; padding: 7px 7px 7px 16px; border-radius: 999px; background: rgba(23,19,61,.92); color: #ffffff; box-shadow: 0 14px 30px rgba(23,19,61,.3)"><div style="flex: 1; white-space: nowrap"><div style="font-size: 12px; opacity: .8">3 товара</div><div style="font-weight: 800; font-size: 15px; font-variant-numeric: tabular-nums">${TOTAL}</div></div><span style="padding: 11px 16px; border-radius: 999px; background: #5EE6B0; color: #0B3A28; box-shadow: 0 4px 0 #26B985; font-weight: 700; font-size: 14px; white-space: nowrap">Заказать в WhatsApp</span></div>`
  : `<div style="margin: 0 auto; width: fit-content; padding: 9px 14px; border-radius: 999px; background: rgba(23,19,61,.86); color: #ffffff; font-weight: 600; font-size: 13px">Нажмите на товар, чтобы выбрать</div>`}</div>`;

// А / Г: три колонки без названий, как витрина на телефоне; нажатие на плитку добавляет
const grid3 = (picked, photos) => `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; padding-top: 3px">${PRODUCTS.map((p, i) => {
  const q = picked ? PICKED[i] : 0;
  return `<div style="position: relative; aspect-ratio: 1 / 1; ${ph(p, photos)}; ${q ? "box-shadow: inset 0 0 0 3px #FFD23F" : ""}">${priceChip(p, true)}${p.low ? lowChip(true) : ""}${q ? count(q, true) : ""}</div>`;
}).join("")}</div>`;
// Б / В: две колонки с названием под фото и «+» на плитке
const grid2 = (picked, photos) => `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 8px; padding: 10px 10px 0">${PRODUCTS.map((p, i) => {
  const q = picked ? PICKED[i] : 0;
  return `<div><div style="position: relative; aspect-ratio: 1 / 1; border-radius: 18px; ${ph(p, photos)}">${priceChip(p)}${p.low ? lowChip() : ""}${plus(q)}</div><div style="margin-top: 6px; padding: 0 4px; font-weight: 600; font-size: 12px; line-height: 1.25">${p.name}</div></div>`;
}).join("")}</div>`;

const screen = (body, bottom) => `<div style="width: 330px; height: 660px; box-sizing: border-box; border-radius: 52px; padding: 12px; background: rgba(255,255,255,.4); border: 1px solid rgba(255,255,255,.85); box-shadow: 0 40px 90px rgba(40,20,110,.28), inset 0 1px 0 #ffffff">
<div style="position: relative; height: 100%; border-radius: 41px; background: #FBFAFF; overflow: hidden">${body}<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 110px; background: linear-gradient(rgba(251,250,255,0), #FBFAFF 55%)"></div>${bottom}</div></div>`;

const VARIANTS = [
  ["А. Как витрина: три колонки, плашка корзины", "Плитки без названий, цена и «мало» на фото — как настоящая витрина на телефоне. Нажатие на плитку добавляет, жёлтая обводка и счётчик. Внизу — тёмная плашка корзины витрины с кнопкой «Заказать в WhatsApp».", (p) => screen(header() + grid3(p, false), cartPill(p))],
  ["Б. Две колонки с названиями", "Рекомендую. Плитки крупнее, под фото название — с заглушками вместо фото без названия не понять, что за товар. «+» на плитке превращается в счётчик. Внизу мятная кнопка, как сейчас.", (p) => screen(header(true) + grid2(p, false), mintButton(p))],
  ["В. Как Б, но с фото", "То же, что Б, только с фото демо-магазина вместо заглушек — для сравнения.", (p) => screen(header(true) + grid2(p, true), mintButton(p))],
  ["Г. Как А, но с фото", "Три колонки с фото: ближе всего к настоящей витрине.", (p) => screen(header() + grid3(p, true), cartPill(p))]
];

const GW = 330 * 2 + 40, GAP_X = 120, ROW_H = 60 + 70 + 660 + 40;
const groups = VARIANTS.map(([title, note, render], i) => {
  const x = 60 + (i % 2) * (GW + GAP_X), y = 60 + Math.floor(i / 2) * (ROW_H + 80);
  return `<div style="position: absolute; left: ${x}px; top: ${y}px; width: ${GW}px">
<div style="font-weight: 800; font-size: 24px">${title}</div>
<div style="margin-top: 8px; font-size: 15px; line-height: 1.45; color: #3A3672; min-height: 66px">${note}</div>
<div style="display: flex; gap: 40px; margin-top: 16px">${[false, true].map((p) => `<div><div style="margin: 0 0 10px 8px; font-weight: 700; font-size: 14px; color: #4A4580">${p ? "Выбрано 3 товара" : "Пусто"}</div>${render(p)}</div>`).join("")}</div>
</div>`;
}).join("\n");
const W = 60 + GW * 2 + GAP_X + 60, H = 60 + 2 * (ROW_H + 80);
const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Лендинг N — телефон покупателя, варианты</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Geologica:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:#C9BBFF}
</style>
</helmet>
<div style="width: ${W}px; height: ${H}px; position: relative; overflow: hidden; font-family: 'Geologica', system-ui, sans-serif; color: #17133D; background: #C9BBFF">
${groups}
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
fs.writeFileSync(out, html);
console.log(W, H, html.length);
