// Фильтры витрины на компьютере (1440×900). Общее во всех вариантах: шесть свойств и цена, выбраны «Рост 110, 116»,
// ничего не сдвигает сетку товаров. Основатель выбрал Г — панель поверх сетки (2026-11-02).
//   node generators/gen-filters-desk.cjs boards/StoreFiltersDesk.dc.html boards/StoreFiltersDeskVariants.dc.html
// Первый файл — утверждённый вариант Г, второй (необязательный) — невыбранные А–В для архива.
const fs = require("fs");
const [out, outArchive] = process.argv.slice(2);
const B = "/_blob/";
const IMG = {
  jacket: "1260977f2c0c34a5b933572bb6e99e94", coat: "4425d713fea616a795f8125f90d8aed0", raincoat: "a3bc2f157acffb785bd68c64b69fa957",
  denim: "8a58a9934844266efb16a8c4761e7f7b", hoodie: "b10ce1436e13380c548fa804ef4347fd", cardigan: "93fc374092f690eb46aa0b0cf74bcce4",
  tshirt: "167257d6a7f8ad684c2d856ae3a11150", sneakers: "04a201bc58d35022516d4467e49b7f41", dressY: "7cb5296df170d7a0aca0d4bd8ec7cb9e",
  dressR: "7d0f77b8370d9af612d61812d7452e5f", beanies: "ca2b511d14dcdf080d3e936049667bed", floral: "ed10ba6d31f748a438a21db8a7387c8a",
  beanie: "b7e066c9d74196dbd3a06f17035798be", pink: "2ec542edaef6635ace484ac3c7ad1f4a"
};
const PRICE = { jacket: "18 900 ₸", coat: "24 900 ₸", raincoat: "7 900 ₸", denim: "12 500 ₸", hoodie: "8 900 ₸", cardigan: "10 400 ₸", tshirt: "3 500 ₸", sneakers: "14 200 ₸", dressY: "8 200 ₸", dressR: "9 500 ₸", beanies: "4 900 ₸", floral: "9 900 ₸", beanie: "4 200 ₸", pink: "11 800 ₸" };
// что подходит под «Рост 110, 116»
const FOUND = ["jacket", "dressR", "raincoat", "denim", "hoodie", "tshirt", "dressY", "cardigan", "floral"];

const icon = {
  search: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B6694" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>',
  filter: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#17133D" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"></path><circle cx="16" cy="7" r="2"></circle><circle cx="10" cy="17" r="2"></circle></svg>',
  bag: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 11H6.2z"></path><path d="M9 8a3 3 0 0 1 6 0"></path></svg>',
  down: (c = "#6B6694") => `<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"><path d="M7 10l5 5 5-5"></path></svg>`,
  up: (c = "#17133D") => `<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"><path d="M7 14l5-5 5 5"></path></svg>`,
  x: (c = "currentColor", s = 12) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>`
};

const ATTRS = [
  ["Рост, см", ["92", "98", "104", "110", "116", "122", "128"]],
  ["Размер обуви", ["24", "25", "26", "27", "28", "29", "30", "31"]],
  ["Цвет", ["Белый", "Серый", "Синий", "Красный", "Жёлтый", "Розовый"]],
  ["Пол", ["Девочки", "Мальчики", "Унисекс"]],
  ["Сезон", ["Лето", "Демисезон", "Зима"]],
  ["Материал", ["Хлопок", "Шерсть", "Деним", "Трикотаж"]]
];
const SHORT = { "Рост, см": "Рост", "Размер обуви": "Обувь" };
const SELECTED = ["110", "116"];
const DOT = { "Белый": "#FFFFFF", "Серый": "#9A95B8", "Синий": "#3B6FD9", "Красный": "#E2453C", "Жёлтый": "#FFD23F", "Розовый": "#FF9CC8" };

const CATS = ["Все", "Куртки", "Платья", "Кофты", "Обувь", "Шапки"];
const chip = (l, on) => `<span style="height: 40px; padding: 0 18px; border-radius: 999px; display: inline-flex; align-items: center; font-weight: 600; font-size: 14px; background: ${on ? "#17133D" : "#EEECF8"}; color: ${on ? "#ffffff" : "#17133D"}">${l}</span>`;
const outline = (inner, active) => `<span style="height: 40px; display: inline-flex; align-items: center; gap: 8px; padding: 0 16px; border: 1.5px solid ${active ? "#17133D" : "#DAD6EC"}; border-radius: 999px; background: #ffffff; font-weight: 600; font-size: 14px; white-space: nowrap">${inner}</span>`;
// значение свойства: квадратный чип (макет V6), у цвета — с кружком
const val = (v, on, big) => {
  const dot = DOT[v] ? `<span style="width: 12px; height: 12px; border-radius: 50%; background: ${DOT[v]}; box-shadow: inset 0 0 0 1px rgba(23,19,61,.18)"></span>` : "";
  const size = big ? "min-width: 52px; height: 44px; padding: 0 14px; border-radius: 14px; font-size: 14px" : "min-width: 44px; height: 36px; padding: 0 10px; border-radius: 12px; font-size: 13px";
  return `<span style="${size}; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; font-variant-numeric: tabular-nums; ${on ? "background: #17133D; color: #ffffff; border: 1.5px solid #17133D" : "background: #ffffff; color: #17133D; border: 1.5px solid #DAD6EC"}">${dot}${v}</span>`;
};
const vals = (values, big) => `<div style="display: flex; flex-wrap: wrap; gap: ${big ? 8 : 6}px">${values.map((v) => val(v, SELECTED.includes(v), big)).join("")}</div>`;
const price = (h = 44) => `<div style="display: flex; gap: 8px">${["от 3 500", "до 24 900"].map((t) => `<span style="flex: 1; height: ${h}px; padding: 0 14px; display: flex; align-items: center; border-radius: 14px; background: #F1EFFA; color: #6B6694; font-size: 14px">${t}</span>`).join("")}</div>`;
const dark = (t, full) => `<span style="display: ${full ? "flex" : "inline-flex"}; align-items: center; justify-content: center; height: 48px; padding: 0 22px; border-radius: 999px; background: #17133D; color: #ffffff; font-weight: 700; font-size: 15px; white-space: nowrap">${t}</span>`;
const link = (t) => `<span style="font-weight: 600; font-size: 14px; color: #3B2FD9; white-space: nowrap">${t}</span>`;
const lilac = (t) => `<span style="display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 12px; border-radius: 999px; background: #E9E5FF; color: #3B2FD9; font-weight: 600; font-size: 13px">${t} ${icon.x()}</span>`;
const sectionTitle = (t) => `<div style="font-weight: 700; font-size: 15px; margin-bottom: 10px">${t}</div>`;

function header() {
  return `<div style="height: 84px; background: #ffffff; border-bottom: 1px solid #ECEAF5"><div style="max-width: 1240px; height: 100%; margin: 0 auto; padding: 0 20px; box-sizing: border-box; display: flex; align-items: center; gap: 24px">
<div style="display: flex; align-items: center; gap: 12px"><span style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center">АK</span><span><span style="display: flex; align-items: center; gap: 4px; font-weight: 800; font-size: 18px">Айгерим Kids ${icon.down()}</span><span style="display: block; font-size: 13px; color: #4A4580">ТЦ «Мега», 2 этаж · <span style="color: #157A52; font-weight: 600">Открыто до 20:00</span></span></span></div>
<div style="flex: 1; max-width: 480px; margin: 0 auto; display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 16px; border-radius: 16px; background: #EEECF8; color: #6B6694; font-size: 15px">${icon.search}Поиск по магазину</div>
<span style="height: 48px; display: inline-flex; align-items: center; padding: 0 18px; border-radius: 999px; background: #5EE6B0; color: #0B3A28; font-weight: 700; font-size: 15px; box-shadow: 0 3px 0 #26B985">Написать в WhatsApp</span>
<span style="height: 48px; display: inline-flex; align-items: center; gap: 10px; padding: 0 18px 0 14px; border-radius: 999px; background: #17133D; color: #ffffff; font-weight: 700; font-size: 15px">${icon.bag}Корзина</span>
</div></div>`;
}
const cats = () => CATS.map((c, i) => chip(c, i === 0)).join("");
const sort = () => outline("Сначала новые " + icon.down("#17133D"));
const tile = (k) => `<div style="position: relative; border-radius: 14px; overflow: hidden; background: #EEECF8"><img src="${B + IMG[k]}" alt="" style="display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: cover"><span style="position: absolute; left: 8px; bottom: 8px; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.92); font-weight: 700; font-size: 14px; font-variant-numeric: tabular-nums">${PRICE[k]}</span></div>`;
const grid = (keys, cols = 5) => `<div style="display: grid; grid-template-columns: repeat(${cols}, minmax(0, 1fr)); gap: 8px">${keys.map(tile).join("")}</div>`;
const wrap = (inner, extra = "") => `<div style="position: relative; max-width: 1240px; margin: 0 auto; padding: 0 20px; box-sizing: border-box; ${extra}">${inner}</div>`;
const panelShadow = "box-shadow: 0 24px 60px rgba(23,19,61,.18)";

const S = [];

// А. Выпадающие списки по свойствам
const pills = ATTRS.map(([name], i) => {
  const short = SHORT[name] || name;
  if (i === 0) return `<span style="height: 40px; display: inline-flex; align-items: center; gap: 8px; padding: 0 14px 0 16px; border-radius: 999px; background: #E9E5FF; color: #3B2FD9; font-weight: 600; font-size: 14px; box-shadow: 0 0 0 2px #3B2FD9; white-space: nowrap">${short}: 110, 116 ${icon.up("#3B2FD9")}</span>`;
  return outline(short + " " + icon.down("#17133D"));
}).concat(outline("Цена " + icon.down("#17133D"))).join("");
const popA = `<div style="position: absolute; z-index: 3; left: 20px; top: 132px; width: 360px; padding: 18px; box-sizing: border-box; border-radius: 22px; background: #ffffff; ${panelShadow}">
<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px"><div style="font-weight: 700; font-size: 15px">Рост, см</div>${link("Сбросить")}</div>
${vals(ATTRS[0][1], true)}
<div style="margin-top: 16px">${dark("Показать 9 товаров", true)}</div>
</div>`;
S.push(["А. Выпадающие списки по свойствам", header() + wrap(`
<div style="display: flex; align-items: center; gap: 8px; padding: 20px 0 12px">${cats()}<span style="flex: 1"></span><span style="font-size: 14px; color: #4A4580; margin-right: 8px">9 товаров</span>${sort()}</div>
<div style="display: flex; align-items: center; gap: 8px; padding: 0 0 14px">${pills}<span style="margin-left: 8px">${link("Сбросить всё")}</span></div>
${grid(FOUND)}${popA}`)]);

// Б. Панель справа
const drawerSections = ATTRS.map(([name, values]) => `<div style="margin-top: 20px">${sectionTitle(name)}${vals(values, true)}</div>`).join("") + `<div style="margin-top: 20px">${sectionTitle("Цена, ₸")}${price(46)}</div>`;
S.push(["Б. Панель фильтров справа", header() + wrap(`
<div style="display: flex; align-items: center; gap: 8px; padding: 20px 0 14px">${cats()}<span style="flex: 1"></span><span style="font-size: 14px; color: #4A4580; margin-right: 8px">9 товаров</span>${outline(icon.filter + "Фильтры · 2", true)}${sort()}</div>
${grid(FOUND)}`) +
  `<div style="position: absolute; inset: 0; z-index: 4; background: rgba(23,19,61,.42)"></div>
<div style="position: absolute; z-index: 5; right: 0; top: 0; bottom: 0; width: 440px; display: flex; flex-direction: column; background: #ffffff; box-shadow: -20px 0 60px rgba(23,19,61,.2)">
<div style="display: flex; align-items: center; justify-content: space-between; padding: 24px 24px 4px"><div style="font-weight: 800; font-size: 22px">Фильтры</div><span style="width: 40px; height: 40px; border-radius: 50%; background: #F1EFFA; display: flex; align-items: center; justify-content: center">${icon.x("#17133D", 16)}</span></div>
<div style="flex: 1; overflow: hidden; padding: 0 24px">${drawerSections}</div>
<div style="display: flex; gap: 10px; padding: 16px 24px 24px; border-top: 1px solid #F0EEF7"><span style="display: inline-flex; align-items: center; justify-content: center; height: 48px; padding: 0 20px; border-radius: 999px; background: #EEECF8; font-weight: 600; font-size: 15px">Сбросить</span><span style="flex: 1">${dark("Показать 9 товаров", true)}</span></div>
</div>`]);

// В. Колонка слева, всегда открыта
const side = ATTRS.map(([name, values], i) => `<div style="padding: 16px 0; border-bottom: 1px solid #ECEAF5"><div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 14px; margin-bottom: ${i < 3 ? 10 : 0}px">${name}${i < 3 ? icon.up() : icon.down("#17133D")}</div>${i < 3 ? vals(values) : ""}</div>`).join("") + `<div style="padding: 16px 0"><div style="font-weight: 700; font-size: 14px; margin-bottom: 10px">Цена, ₸</div>${price(40)}</div>`;
S.push(["В. Колонка фильтров слева", header() + wrap(`
<div style="display: flex; align-items: center; gap: 8px; padding: 20px 0 14px">${cats()}</div>
<div style="display: flex; gap: 28px; align-items: flex-start">
<aside style="width: 260px; flex: none"><div style="display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 4px"><div style="font-weight: 800; font-size: 18px">Фильтры</div>${link("Сбросить")}</div>${side}</aside>
<div style="flex: 1; min-width: 0">
<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px">${lilac("Рост 110")}${lilac("Рост 116")}<span style="flex: 1"></span><span style="font-size: 14px; color: #4A4580; margin-right: 8px">9 товаров</span>${sort()}</div>
${grid(FOUND, 4)}
</div></div>`)]);

// Г. Панель поверх сетки под строкой категорий
const cols = ATTRS.map(([name, values]) => `<div>${sectionTitle(name)}${vals(values)}</div>`).join("") + `<div>${sectionTitle("Цена, ₸")}${price(40)}</div>`;
const G = (["Фильтры открыты — панель поверх сетки", header() + wrap(`
<div style="display: flex; align-items: center; gap: 8px; padding: 20px 0 14px">${cats()}<span style="flex: 1"></span><span style="font-size: 14px; color: #4A4580; margin-right: 8px">9 товаров</span>${outline(icon.filter + "Фильтры · 2 " + icon.up(), true)}${sort()}</div>
<div style="position: relative">${grid(FOUND)}<div style="position: absolute; inset: -8px -8px 0; background: rgba(251,250,255,.7)"></div></div>
<div style="position: absolute; z-index: 3; left: 20px; right: 20px; top: 76px; padding: 22px 24px; border-radius: 22px; background: #ffffff; border: 1px solid #ECEAF5; ${panelShadow}">
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 22px 28px">${cols}</div>
<div style="display: flex; align-items: center; justify-content: space-between; margin-top: 20px; padding-top: 16px; border-top: 1px solid #F0EEF7">${link("Сбросить")}${dark("Показать 9 товаров")}</div>
</div>`)]);

const FW = 1440, FH = 900, GAP = 120, LAB = 50;
function board(list, name) {
const cols2 = Math.min(2, list.length);
const frames = list.map(([title, body], i) => {
  const x = (i % 2) * (FW + GAP) + 60, y = Math.floor(i / 2) * (FH + LAB + GAP) + 60;
  return `<div style="position: absolute; left: ${x}px; top: ${y}px">
<div style="font-weight: 700; font-size: 22px; color: #17133D; margin: 0 0 18px 4px">${title}</div>
<div style="position: relative; width: ${FW}px; height: ${FH}px; border-radius: 24px; overflow: hidden; background: #FBFAFF; box-shadow: 0 24px 60px rgba(40,20,110,.12)">${body}</div>
</div>`;
}).join("\n");
const rows = Math.ceil(list.length / 2);
const W = cols2 * FW + (cols2 - 1) * GAP + 120, H = rows * (FH + LAB + GAP) + 60;
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
${frames}
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

fs.writeFileSync(out, board([G], "Витрина V6 — фильтры на компьютере"));
if (outArchive) fs.writeFileSync(outArchive, board(S, "Витрина V6 — фильтры на компьютере, невыбранные варианты"));
