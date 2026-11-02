// Генерирует StoreContacts.dc.html — контакты в «О магазине» с явными иконками соцсетей (замечание основателя
// 2026-11-02): WhatsApp и Instagram узнаются по значку, длинный логин Instagram не выталкивает WhatsApp.
// Компьютер: выпадающая панель 400 px, кнопки поровну в две колонки, подпись обрезается многоточием.
// Телефон: шторка, строки во всю ширину. Показаны короткий логин, длинный и магазин без Instagram.
//   node generators/gen-contacts.cjs boards/StoreContacts.dc.html
const fs = require("fs");
const out = process.argv[2];

const PHONE = "+7 700 000 00 00";
const SHORT = "@aigerim.kids";
const LONG = "@aigerim.kids.shymkent.official.store";

// значки: WhatsApp — трубка в «облачке» на зелёном круге, Instagram — камера на градиенте
const waGlyph = (s) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"></path><path d="M9.5 9.5c.3 1.8 1.7 3.6 4 4.6l1.2-1.2 1.8.8-.4 1.6c-3.4.2-7.4-3.4-7.6-7l1.6-.4.8 1.8z"></path></svg>`;
const igGlyph = (s) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.2" cy="6.8" r="1" fill="#ffffff" stroke="none"></circle></svg>`;
const waBadge = (d) => `<span style="width: ${d}px; height: ${d}px; flex: none; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center">${waGlyph(Math.round(d * 0.58))}</span>`;
const igBadge = (d) => `<span style="width: ${d}px; height: ${d}px; flex: none; border-radius: ${Math.round(d * 0.3)}px; background: radial-gradient(circle at 30% 107%, #FDF497 0%, #FDF497 5%, #FD5949 45%, #D6249F 60%, #285AEB 90%); display: flex; align-items: center; justify-content: center">${igGlyph(Math.round(d * 0.6))}</span>`;
const ell = "min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap";
const arrow = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6694" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex: none"><path d="M7 17L17 7"></path><path d="M9 7h8v8"></path></svg>`;

// компьютер: кнопка — значок, «WhatsApp» и номер / «Instagram» и логин; ширина поровну, подпись обрезается
const deskBtn = (badge, title, sub, bg) => `<span style="flex: 1 1 0; min-width: 0; display: flex; align-items: center; gap: 10px; height: 56px; padding: 0 12px; box-sizing: border-box; border-radius: 16px; background: ${bg}"> ${badge}<span style="display: flex; flex-direction: column; ${ell}"><span style="font-weight: 700; font-size: 13px; color: #17133D">${title}</span><span style="font-size: 12px; color: #4A4580; font-variant-numeric: tabular-nums; ${ell}">${sub}</span></span></span>`;
const deskContacts = (ig) => `<div style="display: flex; gap: 8px; margin-top: 12px">${deskBtn(waBadge(32), "WhatsApp", PHONE, "#E6FBF2")}${ig ? deskBtn(igBadge(32), "Instagram", ig, "#F6F5FB") : ""}</div>`;

const panel = (ig) => `<div style="width: 400px; padding: 20px; box-sizing: border-box; border-radius: 26px; background: #ffffff; box-shadow: 0 24px 60px rgba(23,19,61,.18)">
<div style="display: flex; gap: 12px"><span style="width: 40px; height: 40px; flex: none; border-radius: 14px; background: #F1EFFA; display: flex; align-items: center; justify-content: center"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B2FD9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"></path><circle cx="12" cy="9.5" r="2.5"></circle></svg></span>
<div><div style="font-weight: 700; font-size: 15px">Шымкент, ТЦ «Мега»</div><div style="font-size: 14px; line-height: 1.5; color: #3A3672; margin-top: 2px">2 этаж, бутик 214. Вход со стороны парковки, от эскалатора направо, рядом с фуд-кортом.</div></div></div>
<div style="display: flex; gap: 8px; margin-top: 14px"><span style="flex: 1; height: 42px; border-radius: 14px; background: #17133D; color: #ffffff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center">Открыть в 2ГИС</span><span style="flex: 1; height: 42px; border-radius: 14px; background: #F1EFFA; font-weight: 600; font-size: 14px; display: flex; align-items: center; justify-content: center">Скопировать адрес</span></div>
<div style="margin-top: 16px; font-size: 14px">
<div style="display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #F0EEF7"><span>Пн–Пт</span><span style="font-variant-numeric: tabular-nums">10:00–20:00</span></div>
<div style="display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #F0EEF7; font-weight: 700"><span>Сегодня, суббота</span><span style="color: #157A52; font-variant-numeric: tabular-nums">11:00–20:00</span></div>
<div style="display: flex; justify-content: space-between; padding: 7px 0"><span>Воскресенье</span><span style="font-variant-numeric: tabular-nums">11:00–18:00</span></div>
</div>
${deskContacts(ig)}
</div>`;

// телефон: строка во всю ширину — значок, название и номер / логин, справа стрелка «откроется приложение»
const phoneRow = (badge, title, sub, bg) => `<div style="display: flex; align-items: center; gap: 12px; height: 60px; padding: 0 14px; border-radius: 16px; background: ${bg}">${badge}<div style="flex: 1; display: flex; flex-direction: column; ${ell}"><span style="font-weight: 600; font-size: 15px">${title}</span><span style="font-size: 13px; color: #4A4580; font-variant-numeric: tabular-nums; ${ell}">${sub}</span></div>${arrow}</div>`;
const sheet = (ig) => `<div style="width: 390px; height: 520px; position: relative; overflow: hidden; border-radius: 32px; background: rgba(23,19,61,.42)">
<div style="position: absolute; left: 0; right: 0; bottom: 0; background: #ffffff; border-radius: 28px 28px 0 0; padding: 10px 16px 24px">
<div style="width: 40px; height: 5px; border-radius: 999px; background: #DCD8EE; margin: 0 auto 14px"></div>
<div style="font-weight: 700; font-size: 15px">График работы</div>
<div style="margin-top: 8px; font-size: 14px; line-height: 1.5">
<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F0EEF7"><span>Пн–Пт</span><span style="font-variant-numeric: tabular-nums">10:00–20:00</span></div>
<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F0EEF7; font-weight: 700"><span>Сегодня, суббота</span><span style="color: #157A52; font-variant-numeric: tabular-nums">11:00–20:00 · открыто</span></div>
<div style="display: flex; justify-content: space-between; padding: 8px 0"><span>Воскресенье</span><span style="font-variant-numeric: tabular-nums">11:00–18:00</span></div>
</div>
<div style="margin-top: 14px; font-weight: 700; font-size: 15px">Связаться</div>
<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px">${phoneRow(waBadge(36), "WhatsApp", PHONE, "#E6FBF2")}${ig ? phoneRow(igBadge(36), "Instagram", ig, "#F6F5FB") : ""}</div>
<p style="margin: 16px 0 0; font-size: 14px; line-height: 1.55; color: #3A3672">Одежда и обувь для детей от 1 до 10 лет.</p>
</div></div>`;

const COL = 440, GAP = 60;
const frames = [
  ["Компьютер · короткий логин", panel(SHORT)],
  ["Компьютер · длинный логин", panel(LONG)],
  ["Компьютер · без Instagram", panel(null)],
  ["Телефон · короткий логин", sheet(SHORT)],
  ["Телефон · длинный логин", sheet(LONG)],
  ["Телефон · без Instagram", sheet(null)]
].map(([title, body], i) => `<div style="position: absolute; left: ${60 + (i % 3) * (COL + GAP)}px; top: ${60 + Math.floor(i / 3) * 660}px">
<div style="font-weight: 700; font-size: 20px; margin: 0 0 16px 4px">${title}</div>${body}</div>`).join("\n");
const W = 60 + 3 * COL + 2 * GAP + 60, H = 60 + 2 * 660;
const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Витрина V6 — контакты в «О магазине»</title>
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
fs.writeFileSync(out, html);
console.log(W, H, html.length);
