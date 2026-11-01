// Генерирует StorePreview.dc.html — витрина в режиме превью из админки (T-113, A7): плашка «Черновик» над шапкой.
// Телефон 390 и компьютер 1440, верх экрана. Плашка — часть шапки: на телефоне закреплена вместе с ней.
//   node generators/gen-preview-banner.cjs boards/StorePreview.dc.html
const fs = require("fs");
const out = process.argv[2];
const B = "/_blob/";
const IMG = {
  jacket: "1260977f2c0c34a5b933572bb6e99e94", dressR: "7d0f77b8370d9af612d61812d7452e5f", sneakers: "04a201bc58d35022516d4467e49b7f41",
  beanies: "ca2b511d14dcdf080d3e936049667bed", raincoat: "a3bc2f157acffb785bd68c64b69fa957", denim: "8a58a9934844266efb16a8c4761e7f7b"
};
const PRICE = { jacket: "18 900 ₸", dressR: "9 500 ₸", sneakers: "14 200 ₸", beanies: "4 900 ₸", raincoat: "7 900 ₸", denim: "12 500 ₸" };
const KEYS = Object.keys(IMG);

const banner = `<div style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 16px; background: #17133D; color: #ffffff; font-weight: 600; font-size: 13px"><span style="padding: 2px 8px; border-radius: 999px; background: #FFD23F; color: #17133D; font-weight: 700; font-size: 12px">Черновик</span>так витрину увидят покупатели</div>`;
const avatar = (s) => `<span style="width: ${s}px; height: ${s}px; flex: none; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: ${s > 44 ? 16 : 15}px; display: flex; align-items: center; justify-content: center">АK</span>`;
const chip = (l, on, h = 38) => `<span style="flex: none; height: ${h}px; padding: 0 16px; border-radius: 999px; display: inline-flex; align-items: center; font-weight: 600; font-size: 14px; background: ${on ? "#17133D" : "#EEECF8"}; color: ${on ? "#ffffff" : "#17133D"}">${l}</span>`;
const cats = (h) => ["Все", "Куртки", "Платья", "Кофты", "Обувь", "Шапки"].map((c, i) => chip(c, i === 0, h)).join("");
const tile = (k, r) => `<div style="position: relative; border-radius: ${r}px; overflow: hidden; background: #EEECF8"><img src="${B + IMG[k]}" alt="" style="display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: cover"><span style="position: absolute; left: 6px; bottom: 6px; padding: 4px 8px; border-radius: 999px; background: rgba(255,255,255,.92); font-weight: 700; font-size: 13px">${PRICE[k]}</span></div>`;

const phone = `<div style="background: #FBFAFF; border-bottom: 1px solid #ECEAF5">${banner}
<div style="display: flex; align-items: center; gap: 10px; padding: 14px 16px 0"><div style="flex: 1; display: flex; align-items: center; gap: 12px">${avatar(44)}<div><div style="font-weight: 800; font-size: 17px">Айгерим Kids ›</div><div style="font-size: 13px; color: #4A4580">ТЦ «Мега», 2 этаж · <span style="color: #157A52; font-weight: 600">Открыто до 20:00</span></div></div></div><span style="width: 44px; height: 44px; border-radius: 50%; background: #5EE6B0; box-shadow: 0 3px 0 #26B985"></span></div>
<div style="padding: 12px 16px 0"><div style="height: 44px; border-radius: 16px; background: #EEECF8; display: flex; align-items: center; padding: 0 14px; color: #6B6694; font-size: 15px">Поиск по магазину</div></div>
<div style="display: flex; gap: 8px; padding: 12px 16px 12px; overflow: hidden">${cats(38)}</div></div>
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; padding-top: 3px">${KEYS.map((k) => tile(k, 0)).join("")}</div>`;

const desk = `${banner}<div style="height: 84px; background: #ffffff; border-bottom: 1px solid #ECEAF5"><div style="max-width: 1240px; height: 100%; margin: 0 auto; padding: 0 20px; box-sizing: border-box; display: flex; align-items: center; gap: 24px">
<div style="display: flex; align-items: center; gap: 12px">${avatar(48)}<div><div style="font-weight: 800; font-size: 18px">Айгерим Kids ⌄</div><div style="font-size: 13px; color: #4A4580">ТЦ «Мега», 2 этаж · <span style="color: #157A52; font-weight: 600">Открыто до 20:00</span></div></div></div>
<div style="flex: 1; max-width: 480px; margin: 0 auto; height: 48px; border-radius: 16px; background: #EEECF8; display: flex; align-items: center; padding: 0 16px; color: #6B6694; font-size: 15px">Поиск по магазину</div>
<span style="height: 48px; display: inline-flex; align-items: center; padding: 0 18px; border-radius: 999px; background: #5EE6B0; color: #0B3A28; font-weight: 700; font-size: 15px; box-shadow: 0 3px 0 #26B985">Написать в WhatsApp</span>
<span style="height: 48px; display: inline-flex; align-items: center; padding: 0 18px; border-radius: 999px; background: #17133D; color: #ffffff; font-weight: 700; font-size: 15px">Корзина</span></div></div>
<div style="max-width: 1240px; margin: 0 auto; padding: 20px 20px 14px; box-sizing: border-box; display: flex; gap: 8px">${cats(40)}</div>
<div style="max-width: 1240px; margin: 0 auto; padding: 0 20px; box-sizing: border-box; display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px">${KEYS.slice(0, 5).map((k) => tile(k, 14)).join("")}</div>`;

const frame = (x, title, w, h, body) => `<div style="position: absolute; left: ${x}px; top: 60px">
<div style="font-weight: 700; font-size: 22px; margin: 0 0 18px 4px">${title}</div>
<div style="position: relative; width: ${w}px; height: ${h}px; border-radius: 24px; overflow: hidden; background: #FBFAFF; box-shadow: 0 24px 60px rgba(40,20,110,.12)">${body}</div></div>`;
const W = 60 + 390 + 80 + 1440 + 60, H = 60 + 50 + 520 + 60;
const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Витрина V6 — превью из админки</title>
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
${frame(60, "Телефон — превью в мастере и в «Магазин»", 390, 520, phone)}
${frame(530, "Компьютер — то же сверху", 1440, 520, desk)}
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
