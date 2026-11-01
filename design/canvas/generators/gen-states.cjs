// Генерирует StoreStates.dc.html — служебные состояния витрины V6 (8 экранов телефона)
const fs = require("fs");
const out = process.argv[2];
const B = "/_blob/";
const IMG = {
  jacket: "1260977f2c0c34a5b933572bb6e99e94", coat: "4425d713fea616a795f8125f90d8aed0", raincoat: "a3bc2f157acffb785bd68c64b69fa957",
  denim: "8a58a9934844266efb16a8c4761e7f7b", hoodie: "b10ce1436e13380c548fa804ef4347fd", cardigan: "93fc374092f690eb46aa0b0cf74bcce4",
  tshirt: "167257d6a7f8ad684c2d856ae3a11150", sneakers: "04a201bc58d35022516d4467e49b7f41", dressY: "7cb5296df170d7a0aca0d4bd8ec7cb9e",
  dressR: "7d0f77b8370d9af612d61812d7452e5f", beanies: "ca2b511d14dcdf080d3e936049667bed", floral: "ed10ba6d31f748a438a21db8a7387c8a"
};
const img = (k) => B + IMG[k];

const icon = {
  search: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B6694" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>',
  filter: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#17133D" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"></path><circle cx="16" cy="7" r="2"></circle><circle cx="10" cy="17" r="2"></circle></svg>',
  wa: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B3A28" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"></path><path d="M9.5 9.5c.3 1.8 1.7 3.6 4 4.6l1.2-1.2 1.8.8-.4 1.6c-3.4.2-7.4-3.4-7.6-7l1.6-.4.8 1.8z"></path></svg>',
  back: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#17133D" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"></path></svg>',
  chev: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6694" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"></path></svg>',
  x: '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>'
};

const chip = (label, on) => `<span style="flex: none; height: 38px; padding: 0 16px; border-radius: 999px; display: inline-flex; align-items: center; font-weight: 600; font-size: 14px; background: ${on ? "#17133D" : "#EEECF8"}; color: ${on ? "#ffffff" : "#17133D"}">${label}</span>`;
const CATS = ["Все", "Куртки", "Платья", "Кофты", "Обувь", "Шапки"];

function header({ search = "", cat = 0, badge = 0, extra = "" } = {}) {
  const searchText = search ? `<span style="color: #17133D">${search}</span><span style="margin-left: auto; width: 22px; height: 22px; border-radius: 50%; background: #DCD8EE; color: #17133D; display: flex; align-items: center; justify-content: center">${icon.x}</span>` : "Поиск по магазину";
  return `<div style="background: #FBFAFF; border-bottom: 1px solid #ECEAF5">
<div style="display: flex; align-items: center; gap: 10px; padding: 14px 16px 0">
<div style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px">
<span style="width: 44px; height: 44px; flex: none; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center">АK</span>
<span style="min-width: 0"><span style="display: flex; align-items: center; gap: 4px; font-weight: 800; font-size: 17px">Айгерим Kids ${icon.chev}</span><span style="display: block; font-size: 13px; color: #4A4580; white-space: nowrap">ТЦ «Мега», 2 этаж · <span style="color: #157A52; font-weight: 600">Открыто до 20:00</span></span></span>
</div>
<span style="width: 44px; height: 44px; flex: none; border-radius: 50%; background: #5EE6B0; box-shadow: 0 3px 0 #26B985; display: flex; align-items: center; justify-content: center">${icon.wa}</span>
</div>
<div style="display: flex; gap: 8px; padding: 12px 16px 0">
<div style="flex: 1; display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 12px 0 14px; border-radius: 16px; background: #EEECF8; color: #6B6694; font-size: 15px">${icon.search}${searchText}</div>
<span style="position: relative; width: 46px; height: 46px; flex: none; border-radius: 16px; background: #EEECF8; display: flex; align-items: center; justify-content: center">${icon.filter}${badge ? `<span style="position: absolute; right: -4px; top: -4px; min-width: 20px; height: 20px; border-radius: 999px; background: #3B2FD9; color: #ffffff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center">${badge}</span>` : ""}</span>
</div>
<div style="display: flex; gap: 8px; padding: 12px 16px 12px; overflow: hidden">${CATS.map((c, i) => chip(c, i === cat)).join("")}</div>
${extra}
</div>`;
}

// Пластилиновые предметы (CSS-заглушки до 3D-иллюстраций)
const clay = {
  tag: (txt, a, b, c, ink, r = 10) => `<div aria-hidden="true" class="st-float" style="--r: ${r}deg; width: 80px; height: 100px; margin: 0 auto; border-radius: 18px; background: radial-gradient(120% 90% at 30% 15%, ${a}, ${b} 55%, ${c}); box-shadow: inset -8px -12px 18px rgba(80,40,0,.28), inset 7px 8px 14px rgba(255,255,255,.55), 0 20px 30px rgba(60,30,120,.22)"><div style="width: 16px; height: 16px; border-radius: 50%; margin: 12px auto 0; background: #FBFAFF; box-shadow: inset 2px 2px 4px rgba(0,0,0,.15)"></div><div style="text-align: center; font-weight: 800; font-size: 22px; margin-top: 10px; color: ${ink}">${txt}</div></div>`,
  cloud: (txt) => `<div aria-hidden="true" class="st-float" style="--r: -4deg; position: relative; width: 132px; height: 84px; margin: 0 auto">
<div style="position: absolute; left: 8px; bottom: 0; width: 116px; height: 54px; border-radius: 999px; background: radial-gradient(120% 120% at 30% 20%, #FFFFFF, #E4DCFF 60%, #B9A9F5); box-shadow: inset -8px -10px 16px rgba(80,60,170,.25), 0 18px 28px rgba(60,30,120,.2)"></div>
<div style="position: absolute; left: 34px; top: 0; width: 64px; height: 64px; border-radius: 50%; background: radial-gradient(120% 120% at 30% 20%, #FFFFFF, #E4DCFF 60%, #B9A9F5); box-shadow: inset -6px -8px 14px rgba(80,60,170,.22)"></div>
<div style="position: absolute; left: 0; right: 0; top: 34px; text-align: center; font-weight: 800; font-size: 22px; color: #3B2FD9">${txt}</div></div>`,
  bubble: (txt) => `<div aria-hidden="true" class="st-float" style="--r: -3deg; display: inline-block; padding: 16px 24px; border-radius: 28px 28px 28px 8px; background: radial-gradient(120% 120% at 30% 15%, #B8FFE2, #5EE6B0 55%, #26B985); color: #0B3A28; font-weight: 800; font-size: 24px; box-shadow: inset -8px -10px 16px rgba(0,60,40,.25), inset 6px 6px 12px rgba(255,255,255,.5), 0 20px 30px rgba(20,90,60,.25); font-variant-numeric: tabular-nums">${txt}</div>`
};

const btnDark = (t) => `<span style="display: inline-flex; align-items: center; justify-content: center; height: 50px; padding: 0 22px; border-radius: 999px; background: #17133D; color: #ffffff; font-weight: 700; font-size: 15px; box-shadow: 0 4px 0 #0B0A26">${t}</span>`;
const btnLink = (t) => `<span style="display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 16px; font-weight: 600; font-size: 15px; color: #3B2FD9">${t}</span>`;
const btnMint = (t, full) => `<span style="display: ${full ? "flex" : "inline-flex"}; align-items: center; justify-content: center; gap: 8px; height: 52px; padding: 0 22px; border-radius: 999px; background: #5EE6B0; color: #0B3A28; font-weight: 700; font-size: 15px; box-shadow: 0 4px 0 #26B985">${t}</span>`;
const mini = (k, price) => `<div style="position: relative; background: #EEECF8"><img src="${img(k)}" alt="" style="display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: cover"><span style="position: absolute; left: 6px; bottom: 6px; padding: 4px 8px; border-radius: 999px; background: rgba(255,255,255,.9); font-weight: 700; font-size: 12px; font-variant-numeric: tabular-nums">${price}</span></div>`;
const center = (inner) => `<div style="padding: 56px 28px 0; text-align: center">${inner}</div>`;
const h = (t) => `<div style="font-weight: 800; font-size: 21px; margin-top: 24px; letter-spacing: -0.01em">${t}</div>`;
const p = (t) => `<p style="margin: 8px auto 0; max-width: 300px; font-size: 15px; line-height: 1.5; color: #3A3672">${t}</p>`;

const screens = [];

// 1. Поиск: ничего не нашлось
screens.push(["Поиск: ничего не нашлось", header({ search: "комбинезон" }) + center(
  clay.tag("?", "#FFF0A8", "#FFD23F", "#E3AE00", "#6B4E00") + h("По запросу «комбинезон» ничего нет") +
  p("Проверьте написание или поищите по категориям. Возможно, у магазина есть похожее — спросите в WhatsApp.") +
  `<div style="margin-top: 22px; display: flex; flex-direction: column; align-items: center; gap: 6px">${btnDark("Сбросить поиск")}${btnLink("Спросить в WhatsApp")}</div>`)]);

// 2. Фильтр: на этот размер ничего нет
screens.push(["Фильтр: на этот размер ничего нет", header({ cat: 2, badge: 1, extra: `<div style="display: flex; gap: 8px; padding: 0 16px 12px"><span style="display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 12px; border-radius: 999px; background: #E9E5FF; color: #3B2FD9; font-weight: 600; font-size: 13px">Рост 128 ${icon.x}</span></div>` }) +
  center(clay.tag("128", "#FFC9B5", "#FF8F6B", "#D9532F", "#5A1E0B", -8) + h("Платьев на рост 128 сейчас нет") +
  p("Уберите фильтр или посмотрите, что есть на этот рост в других категориях.") +
  `<div style="margin-top: 20px">${btnDark("Убрать фильтр «Рост 128»")}</div>`) +
  `<div style="margin-top: 30px; padding: 0 16px; display: flex; justify-content: space-between; align-items: baseline"><div style="font-weight: 700; font-size: 15px">На рост 128 есть</div><div style="font-size: 13px; font-weight: 600; color: #3B2FD9">Все 6 →</div></div>
<div style="margin-top: 10px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px">${mini("hoodie", "8 900 ₸")}${mini("cardigan", "10 400 ₸")}${mini("tshirt", "3 500 ₸")}</div>`]);

// 3. Загрузка
const sk = (w, hh, r = 8, extra = "") => `<div class="st-sk" style="width: ${w}; height: ${hh}px; border-radius: ${r}px; ${extra}"></div>`;
screens.push(["Загрузка: скелетоны", header() +
  `<div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 16px 12px">${sk("82px", 14)}${sk("110px", 14)}</div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px">${Array.from({ length: 15 }, (_, i) => `<div class="st-sk" style="aspect-ratio: 1 / 1; border-radius: 0; animation-delay: ${(i % 3) * 0.12}s"></div>`).join("")}</div>
<p style="text-align: center; margin: 14px 16px 0; font-size: 12px; color: #6B6694">Шапка и категории из кэша появляются сразу, сетка — по мере загрузки</p>`]);

// 4. Нет интернета
screens.push(["Нет интернета / ошибка", header() + center(
  clay.cloud("!") + h("Нет связи") +
  p("Похоже, пропал интернет. Как только связь вернётся, каталог загрузится сам.") +
  `<div style="margin-top: 22px">${btnDark("Повторить")}</div>`) +
  `<div style="margin: 40px 16px 0; padding: 14px 16px; border-radius: 18px; background: #F1EFFA; font-size: 14px; line-height: 1.5; color: #3A3672">Корзина сохранена на этом телефоне — товары никуда не денутся.</div>`]);

// 5. Товар закончился (старая ссылка)
screens.push(["Товар закончился (старая ссылка)", `<div style="position: relative">
<img src="${img("coat")}" alt="" style="display: block; width: 100%; height: 380px; object-fit: cover; filter: grayscale(.85) brightness(1.05)">
<span style="position: absolute; left: 14px; top: 14px; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,.88); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(23,19,61,.12)">${icon.back}</span>
<span style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-4deg); padding: 10px 18px; border-radius: 999px; background: #17133D; color: #ffffff; font-weight: 800; font-size: 16px">Закончился</span>
</div>
<div style="padding: 18px 16px 0">
<div style="font-size: 13px; color: #4A4580">Куртки и верхняя одежда</div>
<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-top: 4px"><div style="font-weight: 800; font-size: 22px; letter-spacing: -0.02em">Пальто шерстяное</div><div style="font-weight: 800; font-size: 20px; color: #7A7598; font-variant-numeric: tabular-nums">24 900 ₸</div></div>
<p style="margin: 10px 0 0; font-size: 15px; line-height: 1.5; color: #3A3672">Этот товар раскупили. Магазин может привезти ещё — спросите о поступлении.</p>
<div style="margin-top: 14px">${btnMint(icon.wa + "Спросить о поступлении", true)}</div>
<div style="margin-top: 24px; font-weight: 700; font-size: 15px">Ещё в этой категории</div>
</div>
<div style="margin-top: 10px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px">${mini("jacket", "18 900 ₸")}${mini("raincoat", "7 900 ₸")}${mini("denim", "12 500 ₸")}</div>`]);

// 6. Корзина: цены и наличие изменились
const row = (k, name, sub, price, note, tone, dim) => `<div style="display: flex; gap: 12px; align-items: flex-start; ${dim ? "opacity: .55" : ""}">
<img src="${img(k)}" alt="" style="width: 64px; height: 64px; border-radius: 16px; object-fit: cover; background: #EEECF8; flex: none; ${dim ? "filter: grayscale(1)" : ""}">
<div style="flex: 1; min-width: 0"><div style="font-weight: 600; font-size: 15px">${name}</div><div style="font-size: 13px; color: #4A4580">${sub}</div><div style="font-weight: 800; font-size: 15px; margin-top: 2px; font-variant-numeric: tabular-nums">${price}</div></div></div>
${note ? `<div style="margin: -4px 0 0 76px; padding: 8px 12px; border-radius: 12px; font-size: 13px; line-height: 1.4; font-weight: 600; ${tone}">${note}</div>` : ""}`;
screens.push(["Корзина: цены и наличие изменились", `<div style="position: absolute; inset: 0; filter: blur(1px)">${header()}<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px; margin-top: 40px">${["jacket", "dressR", "sneakers", "beanies", "raincoat", "denim"].map((k) => mini(k, "")).join("")}</div></div>
<div style="position: absolute; inset: 0; background: rgba(23,19,61,.42)"></div>
<div style="position: absolute; left: 0; right: 0; bottom: 0; background: #ffffff; border-radius: 28px 28px 0 0; padding: 10px 16px 24px">
<div style="width: 40px; height: 5px; border-radius: 999px; background: #DCD8EE; margin: 0 auto 14px"></div>
<div style="font-weight: 800; font-size: 20px">Корзина</div>
<div style="margin-top: 10px; padding: 12px 14px; border-radius: 16px; background: #FFF4D6; color: #5A3E00; font-size: 14px; line-height: 1.45">Пока товары лежали в корзине, магазин кое-что обновил. Проверьте перед заказом.</div>
<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 14px">
${row("jacket", "Куртка демисезонная", "Рост 110 · 1 шт.", "17 500 ₸", "Цена снизилась: было 18 900 ₸", "background: #E6FBF2; color: #0B3A28")}
${row("sneakers", "Кроссовки на липучках", "Размер 27 · 1 шт.", "14 200 ₸", "Осталась 1 пара — убрали вторую", "background: #FFF1D6; color: #7A4300")}
${row("dressY", "Платье летнее", "Рост 104", "8 200 ₸", "Рост 104 закончился · <u>Убрать</u>", "background: #F1EFFA; color: #4A4580", true)}
</div>
<div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 16px"><span style="font-size: 15px; color: #3A3672">Итого</span><span style="font-weight: 800; font-size: 22px; font-variant-numeric: tabular-nums">31 700 ₸</span></div>
<div style="margin-top: 12px">${btnMint("Заказать через WhatsApp", true)}</div>
</div>`, true]);

// 7. Заказ отправлен
screens.push(["Заказ отправлен", `<div style="padding: 90px 28px 0; text-align: center">
${clay.bubble("Отправлено ✓")}
${h("Заявка ушла в WhatsApp")}
${p("Магазин проверит наличие и ответит вам в чате. Если WhatsApp не открылся — нажмите «Открыть ещё раз».")}
<div style="margin: 26px auto 0; max-width: 320px; text-align: left; border-radius: 22px; background: #ffffff; border: 1px solid #ECEAF5; padding: 16px">
<div style="display: flex; justify-content: space-between; font-size: 14px; color: #4A4580"><span>2 товара</span><span style="font-weight: 800; font-size: 16px; color: #17133D; font-variant-numeric: tabular-nums">31 700 ₸</span></div>
<div style="display: flex; gap: 8px; margin-top: 12px"><img src="${img("jacket")}" alt="" style="width: 52px; height: 52px; border-radius: 14px; object-fit: cover"><img src="${img("sneakers")}" alt="" style="width: 52px; height: 52px; border-radius: 14px; object-fit: cover"></div>
</div>
<div style="margin-top: 22px; display: flex; flex-direction: column; align-items: center; gap: 6px">${btnDark("Вернуться в каталог")}${btnLink("Открыть WhatsApp ещё раз")}</div>
</div>`]);

// 8. Каталог скрыт / магазин недоступен
screens.push(["Каталог скрыт / магазин недоступен", `<div style="padding: 70px 28px 0; text-align: center">
<span style="width: 72px; height: 72px; margin: 0 auto; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 24px; display: flex; align-items: center; justify-content: center">АK</span>
<div style="font-weight: 800; font-size: 20px; margin-top: 12px">Айгерим Kids</div>
<div style="margin-top: 30px">${clay.tag("скоро", "#B8FFE2", "#5EE6B0", "#26B985", "#0B3A28", 6)}</div>
${h("Каталог сейчас обновляется")}
${p("Магазин временно скрыл товары. Напишите в WhatsApp — подскажут, что есть в наличии.")}
<div style="margin-top: 20px">${btnMint(icon.wa + "Написать в WhatsApp")}</div>
<div style="margin: 28px auto 0; max-width: 320px; text-align: left; border-radius: 22px; background: #F1EFFA; padding: 16px; font-size: 14px; line-height: 1.5; color: #3A3672"><div style="font-weight: 700; color: #17133D">Шымкент, ТЦ «Мега», 2 этаж, бутик 214</div>Пн–Пт 10:00–20:00 · Сб 11:00–20:00 · Вс 11:00–18:00</div>
</div>`]);

const COLW = 430, ROWH = 960;
const phones = screens.map(([title, body, abs], i) => {
  const x = (i % 4) * COLW + 40, y = Math.floor(i / 4) * ROWH + 40;
  return `<div style="position: absolute; left: ${x}px; top: ${y}px">
<div style="font-weight: 700; font-size: 17px; color: #17133D; margin: 0 0 14px 4px">${i + 1}. ${title}</div>
<div style="position: relative; width: 390px; height: 844px; border-radius: 40px; overflow: hidden; background: #FBFAFF; box-shadow: 0 24px 60px rgba(40,20,110,.14)">${body}</div>
</div>`;
}).join("\n");

const W = COLW * 4 + 40, H = ROWH * 2 + 40;
const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Витрина V6 — состояния</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Geologica:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:#F1F0F7}
.st-float{animation:stFloat 5s ease-in-out infinite;transform:rotate(var(--r,0deg))}
@keyframes stFloat{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}50%{transform:translateY(-8px) rotate(calc(var(--r,0deg) + 3deg))}}
.st-sk{background:linear-gradient(90deg,#EEECF8 0%,#F7F6FC 45%,#EEECF8 90%);background-size:220% 100%;animation:stSk 1.4s ease-in-out infinite}
@keyframes stSk{from{background-position:120% 0}to{background-position:-100% 0}}
@media (prefers-reduced-motion:reduce){.st-float,.st-sk{animation:none}}
</style>
</helmet>
<div style="width: ${W}px; height: ${H}px; position: relative; overflow: hidden; font-family: 'Geologica', system-ui, sans-serif; color: #17133D; background: #F1F0F7">
${phones}
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
