// Генерирует StoreStatesDesk.dc.html — служебные состояния витрины V6 для компьютера (8 экранов 1440×900)
const fs = require("fs");
const out = process.argv[2];
const B = "/_blob/";
const IMG = {
  jacket: "1260977f2c0c34a5b933572bb6e99e94", coat: "4425d713fea616a795f8125f90d8aed0", raincoat: "a3bc2f157acffb785bd68c64b69fa957",
  denim: "8a58a9934844266efb16a8c4761e7f7b", hoodie: "b10ce1436e13380c548fa804ef4347fd", cardigan: "93fc374092f690eb46aa0b0cf74bcce4",
  tshirt: "167257d6a7f8ad684c2d856ae3a11150", sneakers: "04a201bc58d35022516d4467e49b7f41", dressY: "7cb5296df170d7a0aca0d4bd8ec7cb9e",
  dressR: "7d0f77b8370d9af612d61812d7452e5f", beanies: "ca2b511d14dcdf080d3e936049667bed", floral: "ed10ba6d31f748a438a21db8a7387c8a",
  beanie: "b7e066c9d74196dbd3a06f17035798be", pink: "2ec542edaef6635ace484ac3c7ad1f4a"
};
const img = (k) => B + IMG[k];
const PRICE = { jacket: "18 900 ₸", coat: "24 900 ₸", raincoat: "7 900 ₸", denim: "12 500 ₸", hoodie: "8 900 ₸", cardigan: "10 400 ₸", tshirt: "3 500 ₸", sneakers: "14 200 ₸", dressY: "8 200 ₸", dressR: "9 500 ₸", beanies: "4 900 ₸", floral: "9 900 ₸", beanie: "4 200 ₸", pink: "11 800 ₸" };
const ALL = ["jacket", "dressR", "sneakers", "beanie", "raincoat", "denim", "hoodie", "tshirt", "dressY", "pink", "coat", "beanies", "cardigan", "floral"];

const icon = {
  search: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B6694" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>',
  filter: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#17133D" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"></path><circle cx="16" cy="7" r="2"></circle><circle cx="10" cy="17" r="2"></circle></svg>',
  wa: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B3A28" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"></path><path d="M9.5 9.5c.3 1.8 1.7 3.6 4 4.6l1.2-1.2 1.8.8-.4 1.6c-3.4.2-7.4-3.4-7.6-7l1.6-.4.8 1.8z"></path></svg>',
  bag: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 11H6.2z"></path><path d="M9 8a3 3 0 0 1 6 0"></path></svg>',
  down: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6694" stroke-width="2.4" stroke-linecap="round"><path d="M7 10l5 5 5-5"></path></svg>',
  x: (c = "currentColor", s = 12) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>`
};
const CATS = ["Все", "Куртки", "Платья", "Кофты", "Обувь", "Шапки"];
const chip = (l, on) => `<span style="height: 40px; padding: 0 18px; border-radius: 999px; display: inline-flex; align-items: center; font-weight: 600; font-size: 14px; background: ${on ? "#17133D" : "#EEECF8"}; color: ${on ? "#ffffff" : "#17133D"}">${l}</span>`;
const outline = (inner) => `<span style="height: 40px; display: inline-flex; align-items: center; gap: 8px; padding: 0 16px; border: 1.5px solid #DAD6EC; border-radius: 999px; background: #ffffff; font-weight: 600; font-size: 14px">${inner}</span>`;

function header({ search = "", cart = "Корзина", cartOpen = false } = {}) {
  const s = search ? `<span style="color: #17133D">${search}</span><span style="margin-left: auto; width: 24px; height: 24px; border-radius: 50%; background: #DCD8EE; color: #17133D; display: flex; align-items: center; justify-content: center">${icon.x()}</span>` : "Поиск по магазину";
  return `<div style="height: 84px; background: #ffffff; border-bottom: 1px solid #ECEAF5"><div style="max-width: 1240px; height: 100%; margin: 0 auto; padding: 0 20px; box-sizing: border-box; display: flex; align-items: center; gap: 24px">
<div style="display: flex; align-items: center; gap: 12px"><span style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center">АK</span><span><span style="display: flex; align-items: center; gap: 4px; font-weight: 800; font-size: 18px">Айгерим Kids ${icon.down}</span><span style="display: block; font-size: 13px; color: #4A4580">ТЦ «Мега», 2 этаж · <span style="color: #157A52; font-weight: 600">Открыто до 20:00</span></span></span></div>
<div style="flex: 1; max-width: 480px; margin: 0 auto; display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 14px 0 16px; border-radius: 16px; background: #EEECF8; color: #6B6694; font-size: 15px; ${search ? "box-shadow: inset 0 0 0 2px #3B2FD9; background: #ffffff" : ""}">${icon.search}${s}</div>
<span style="height: 48px; display: inline-flex; align-items: center; padding: 0 18px; border-radius: 999px; background: #5EE6B0; color: #0B3A28; font-weight: 700; font-size: 15px; box-shadow: 0 3px 0 #26B985">Написать в WhatsApp</span>
<span style="height: 48px; display: inline-flex; align-items: center; gap: 10px; padding: 0 18px 0 14px; border-radius: 999px; background: #17133D; color: #ffffff; font-weight: 700; font-size: 15px; font-variant-numeric: tabular-nums; ${cartOpen ? "box-shadow: 0 0 0 3px #ffffff, 0 0 0 5px #3B2FD9" : ""}">${icon.bag}${cart}</span>
</div></div>`;
}
function toolbar({ cat = 0, count = "14 товаров", filters = "Фильтры", extra = "" } = {}) {
  return `<div style="max-width: 1240px; margin: 0 auto; padding: 0 20px; box-sizing: border-box"><div style="display: flex; align-items: center; gap: 8px; padding: 20px 0 14px">${CATS.map((c, i) => chip(c, i === cat)).join("")}<span style="flex: 1"></span><span style="font-size: 14px; color: #4A4580; margin-right: 8px">${count}</span>${outline(icon.filter + filters)}${outline("Сначала новые " + icon.down)}</div>${extra}</div>`;
}
const tile = (k, few) => `<div style="position: relative; border-radius: 14px; overflow: hidden; background: #EEECF8"><img src="${img(k)}" alt="" style="display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: cover"><span style="position: absolute; left: 8px; bottom: 8px; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.92); font-weight: 700; font-size: 14px; font-variant-numeric: tabular-nums">${PRICE[k]}</span></div>`;
const grid = (keys, cols = 5) => `<div style="display: grid; grid-template-columns: repeat(${cols}, minmax(0, 1fr)); gap: 8px">${keys.map((k) => tile(k)).join("")}</div>`;
const catalog = () => header() + toolbar() + `<div style="max-width: 1240px; margin: 0 auto; padding: 0 20px; box-sizing: border-box">${grid(ALL.slice(0, 10))}</div>`;

const clay = {
  tag: (txt, a, b, c, ink, r = 10, sc = 1) => `<div aria-hidden="true" class="st-float" style="--r: ${r}deg; width: ${96 * sc}px; height: ${120 * sc}px; margin: 0 auto; border-radius: 22px; background: radial-gradient(120% 90% at 30% 15%, ${a}, ${b} 55%, ${c}); box-shadow: inset -10px -14px 20px rgba(80,40,0,.28), inset 8px 9px 16px rgba(255,255,255,.55), 0 24px 36px rgba(60,30,120,.22)"><div style="width: 18px; height: 18px; border-radius: 50%; margin: 14px auto 0; background: #FBFAFF; box-shadow: inset 2px 2px 4px rgba(0,0,0,.15)"></div><div style="text-align: center; font-weight: 800; font-size: 26px; margin-top: 12px; color: ${ink}">${txt}</div></div>`,
  cloud: (txt) => `<div aria-hidden="true" class="st-float" style="--r: -4deg; position: relative; width: 160px; height: 100px; margin: 0 auto"><div style="position: absolute; left: 10px; bottom: 0; width: 140px; height: 64px; border-radius: 999px; background: radial-gradient(120% 120% at 30% 20%, #FFFFFF, #E4DCFF 60%, #B9A9F5); box-shadow: inset -8px -10px 16px rgba(80,60,170,.25), 0 18px 28px rgba(60,30,120,.2)"></div><div style="position: absolute; left: 42px; top: 0; width: 76px; height: 76px; border-radius: 50%; background: radial-gradient(120% 120% at 30% 20%, #FFFFFF, #E4DCFF 60%, #B9A9F5); box-shadow: inset -6px -8px 14px rgba(80,60,170,.22)"></div><div style="position: absolute; left: 0; right: 0; top: 42px; text-align: center; font-weight: 800; font-size: 26px; color: #3B2FD9">${txt}</div></div>`,
  bubble: (txt) => `<div aria-hidden="true" class="st-float" style="--r: -3deg; display: inline-block; padding: 18px 28px; border-radius: 30px 30px 30px 8px; background: radial-gradient(120% 120% at 30% 15%, #B8FFE2, #5EE6B0 55%, #26B985); color: #0B3A28; font-weight: 800; font-size: 28px; box-shadow: inset -8px -10px 16px rgba(0,60,40,.25), inset 6px 6px 12px rgba(255,255,255,.5), 0 20px 30px rgba(20,90,60,.25); font-variant-numeric: tabular-nums">${txt}</div>`
};
const btnDark = (t) => `<span style="display: inline-flex; align-items: center; justify-content: center; height: 52px; padding: 0 24px; border-radius: 999px; background: #17133D; color: #ffffff; font-weight: 700; font-size: 15px; box-shadow: 0 4px 0 #0B0A26">${t}</span>`;
const btnSoft = (t) => `<span style="display: inline-flex; align-items: center; justify-content: center; height: 52px; padding: 0 22px; border-radius: 999px; background: #EEECF8; color: #17133D; font-weight: 600; font-size: 15px">${t}</span>`;
const btnMint = (t, full) => `<span style="display: ${full ? "flex" : "inline-flex"}; align-items: center; justify-content: center; gap: 8px; height: 54px; padding: 0 24px; border-radius: 999px; background: #5EE6B0; color: #0B3A28; font-weight: 700; font-size: 16px; box-shadow: 0 4px 0 #26B985">${t}</span>`;
const h = (t) => `<div style="font-weight: 800; font-size: 28px; margin-top: 26px; letter-spacing: -0.02em">${t}</div>`;
const p = (t) => `<p style="margin: 10px auto 0; max-width: 460px; font-size: 16px; line-height: 1.55; color: #3A3672">${t}</p>`;
const center = (inner, top = 70) => `<div style="padding: ${top}px 40px 0; text-align: center">${inner}</div>`;
const row = (...btns) => `<div style="margin-top: 26px; display: flex; justify-content: center; gap: 10px">${btns.join("")}</div>`;
const dim = (z = 5) => `<div style="position: absolute; inset: 0; z-index: ${z}; background: rgba(23,19,61,.55)"></div>`;

const S = [];

// 1. Поиск ничего не нашёл
S.push(["Поиск: ничего не нашлось", header({ search: "комбинезон" }) + toolbar({ count: "0 товаров" }) + center(
  clay.tag("?", "#FFF0A8", "#FFD23F", "#E3AE00", "#6B4E00") + h("По запросу «комбинезон» ничего нет") +
  p("Проверьте написание или поищите по категориям. Возможно, у магазина есть похожее — спросите в WhatsApp, сообщение уже будет готово.") +
  row(btnDark("Сбросить поиск"), btnMint(icon.wa + "Спросить в WhatsApp")), 40)]);

// 2. На этот размер ничего нет
const fRow = `<div style="display: flex; align-items: center; gap: 10px; padding: 14px 18px; margin-bottom: 10px; border-radius: 22px; background: #ffffff; border: 1px solid #ECEAF5; font-size: 14px"><span style="font-weight: 700">Рост</span>${["92", "98", "104", "110", "116", "122", "128"].map((v) => `<span style="min-width: 44px; height: 36px; padding: 0 10px; box-sizing: border-box; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; ${v === "128" ? "background: #17133D; color: #ffffff" : "border: 1.5px solid #DAD6EC; background: #ffffff"}">${v}</span>`).join("")}<span style="flex: 1"></span><span style="font-weight: 600; color: #3B2FD9">Сбросить</span></div>`;
S.push(["Фильтр: на этот размер ничего нет", header() + toolbar({ cat: 2, count: "0 товаров", filters: "Фильтры · 1", extra: fRow }) +
  `<div style="display: flex; align-items: center; gap: 56px; max-width: 1200px; margin: 30px auto 0; padding: 0 20px">
<div style="width: 420px; flex: none; text-align: center">${clay.tag("128", "#FFC9B5", "#FF8F6B", "#D9532F", "#5A1E0B", -8)}${h("Платьев на рост 128 сейчас нет")}${p("Уберите фильтр или посмотрите, что есть на этот рост в других категориях.")}${row(btnDark("Убрать фильтр «Рост 128»"))}</div>
<div style="flex: 1"><div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px"><div style="font-weight: 800; font-size: 18px">На рост 128 есть в других категориях</div><div style="font-weight: 600; font-size: 14px; color: #3B2FD9">Все 6 →</div></div>${grid(["hoodie", "cardigan", "tshirt", "jacket", "raincoat", "denim"], 3)}</div></div>`]);

// 3. Загрузка
S.push(["Загрузка: скелетоны", header() + toolbar({ count: '<span class="st-sk" style="display: inline-block; width: 80px; height: 14px; border-radius: 8px; vertical-align: middle"></span>' }) +
  `<div style="max-width: 1240px; margin: 0 auto; padding: 0 20px; box-sizing: border-box"><div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px">${Array.from({ length: 10 }, (_, i) => `<div class="st-sk" style="aspect-ratio: 1 / 1; border-radius: 14px; animation-delay: ${(i % 5) * 0.1}s"></div>`).join("")}</div></div>`]);

// 4. Нет интернета
S.push(["Нет интернета / ошибка", header() + toolbar() + center(
  clay.cloud("!") + h("Нет связи") + p("Похоже, пропал интернет. Как только связь вернётся, каталог загрузится сам. Корзина сохранена на этом устройстве.") +
  row(btnDark("Повторить")), 50)]);

// 5. Товар закончился — окно поверх сетки
S.push(["Товар закончился (старая ссылка)", catalog() + dim() +
  `<div style="position: absolute; z-index: 6; left: 200px; top: 90px; width: 1040px; height: 720px; display: flex; border-radius: 30px; overflow: hidden; background: #ffffff; box-shadow: 0 40px 100px rgba(11,10,38,.35)">
<div style="position: relative; width: 576px; flex: none"><img src="${img("coat")}" alt="" style="display: block; width: 100%; height: 100%; object-fit: cover; filter: grayscale(.85) brightness(1.05)"><span style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-4deg); padding: 12px 22px; border-radius: 999px; background: #17133D; color: #ffffff; font-weight: 800; font-size: 20px">Закончился</span></div>
<div style="flex: 1; position: relative; padding: 30px 32px">
<span style="position: absolute; right: 20px; top: 20px; width: 44px; height: 44px; border-radius: 50%; background: #F1EFFA; display: flex; align-items: center; justify-content: center">${icon.x("#17133D", 18)}</span>
<div style="font-size: 14px; color: #4A4580">Куртки и верхняя одежда</div>
<div style="margin: 6px 56px 0 0; font-weight: 800; font-size: 30px; letter-spacing: -0.03em; line-height: 1.1">Пальто шерстяное</div>
<div style="margin-top: 10px; font-weight: 800; font-size: 28px; color: #7A7598; font-variant-numeric: tabular-nums">24 900 ₸</div>
<p style="margin: 16px 0 0; font-size: 15px; line-height: 1.55; color: #3A3672">Этот товар раскупили. Магазин может привезти ещё — спросите о поступлении, название товара уже будет в сообщении.</p>
<div style="margin-top: 18px">${btnMint(icon.wa + "Спросить о поступлении", true)}</div>
<div style="margin-top: 30px; font-weight: 700; font-size: 15px">Ещё в этой категории</div>
<div style="margin-top: 12px">${grid(["jacket", "raincoat", "denim"], 3)}</div>
</div></div>`]);

// 6. Корзина: цены и наличие изменились
const crow = (k, name, sub, price, note, tone, gray) => `<div style="display: flex; gap: 12px; align-items: center; ${gray ? "opacity: .55" : ""}"><img src="${img(k)}" alt="" style="width: 60px; height: 60px; border-radius: 14px; object-fit: cover; ${gray ? "filter: grayscale(1)" : ""}"><div style="flex: 1; min-width: 0"><div style="font-weight: 600; font-size: 14px">${name}</div><div style="font-size: 13px; color: #4A4580">${sub}</div></div><div style="font-weight: 800; font-size: 14px; font-variant-numeric: tabular-nums">${price}</div></div>
<div style="margin: -4px 0 0 72px; padding: 8px 12px; border-radius: 12px; font-size: 13px; line-height: 1.4; font-weight: 600; ${tone}">${note}</div>`;
S.push(["Корзина: цены и наличие изменились", header({ cart: "3 · 31 700 ₸", cartOpen: true }) + toolbar() + `<div style="max-width: 1240px; margin: 0 auto; padding: 0 20px; box-sizing: border-box">${grid(ALL.slice(0, 10))}</div>` +
  `<div style="position: absolute; z-index: 6; right: 120px; top: 88px; width: 420px; padding: 22px; box-sizing: border-box; border-radius: 26px; background: #ffffff; box-shadow: 0 24px 60px rgba(23,19,61,.22)">
<div style="font-weight: 800; font-size: 19px">Корзина</div>
<div style="margin-top: 10px; padding: 12px 14px; border-radius: 16px; background: #FFF4D6; color: #5A3E00; font-size: 14px; line-height: 1.45">Пока товары лежали в корзине, магазин кое-что обновил. Проверьте перед заказом.</div>
<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 14px">
${crow("jacket", "Куртка демисезонная", "Рост 110 · 1 шт.", "17 500 ₸", "Цена снизилась: было 18 900 ₸", "background: #E6FBF2; color: #0B3A28")}
${crow("sneakers", "Кроссовки на липучках", "Размер 27 · 1 шт.", "14 200 ₸", "Осталась 1 пара — убрали вторую", "background: #FFF1D6; color: #7A4300")}
${crow("dressY", "Платье летнее", "Рост 104", "8 200 ₸", "Рост 104 закончился · <u>Убрать</u>", "background: #F1EFFA; color: #4A4580", true)}
</div>
<div style="margin-top: 14px; height: 46px; padding: 0 14px; display: flex; align-items: center; border-radius: 14px; background: #F6F5FB; color: #6B6694; font-size: 14px">Комментарий для магазина</div>
<div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 16px"><span style="font-size: 14px; color: #3A3672">Итого</span><span style="font-weight: 800; font-size: 22px; font-variant-numeric: tabular-nums">31 700 ₸</span></div>
<div style="margin-top: 12px">${btnMint("Заказать через WhatsApp", true)}</div>
</div>`]);

// 7. Заказ отправлен — окно поверх каталога
S.push(["Заказ отправлен", catalog() + dim() +
  `<div style="position: absolute; z-index: 6; left: 420px; top: 120px; width: 600px; padding: 48px 48px 40px; box-sizing: border-box; border-radius: 34px; background: #ffffff; text-align: center; box-shadow: 0 40px 100px rgba(11,10,38,.35)">
${clay.bubble("Отправлено ✓")}
${h("Заявка ушла в WhatsApp")}
${p("Магазин проверит наличие и ответит вам в чате. Если WhatsApp не открылся — откройте ещё раз или скопируйте текст заказа и отправьте сами.")}
<div style="margin: 22px auto 0; max-width: 420px; display: flex; align-items: center; gap: 12px; text-align: left; border-radius: 20px; background: #F6F5FB; padding: 14px 16px"><img src="${img("jacket")}" alt="" style="width: 48px; height: 48px; border-radius: 12px; object-fit: cover"><img src="${img("sneakers")}" alt="" style="width: 48px; height: 48px; border-radius: 12px; object-fit: cover"><span style="flex: 1; font-size: 14px; color: #4A4580">2 товара</span><span style="font-weight: 800; font-size: 17px; font-variant-numeric: tabular-nums">31 700 ₸</span></div>
<div style="margin-top: 26px; display: flex; flex-direction: column; gap: 10px">${btnDark("Вернуться в каталог")}<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">${btnSoft("Открыть WhatsApp")}${btnSoft("Скопировать текст")}</div></div>
</div>`]);

// 8. Каталог скрыт
S.push(["Каталог скрыт / магазин недоступен", `<div style="display: flex; align-items: center; gap: 56px; max-width: 1040px; margin: 0 auto; padding: 150px 40px 0">
<div style="flex: 1">
<div style="display: flex; align-items: center; gap: 14px"><span style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 22px; display: flex; align-items: center; justify-content: center">АK</span><div><div style="font-weight: 800; font-size: 22px">Айгерим Kids</div><div style="font-size: 14px; color: #4A4580">Детская одежда от 1 до 10 лет</div></div></div>
<div style="font-weight: 800; font-size: 40px; letter-spacing: -0.03em; line-height: 1.1; margin-top: 34px">Каталог сейчас обновляется</div>
<p style="margin: 14px 0 0; max-width: 460px; font-size: 17px; line-height: 1.55; color: #3A3672">Магазин временно скрыл товары. Напишите в WhatsApp — подскажут, что есть в наличии.</p>
<div style="margin-top: 26px">${btnMint(icon.wa + "Написать в WhatsApp")}</div>
<div style="margin-top: 30px; max-width: 460px; border-radius: 22px; background: #F1EFFA; padding: 18px 20px; font-size: 15px; line-height: 1.55; color: #3A3672"><div style="font-weight: 700; color: #17133D">Шымкент, ТЦ «Мега», 2 этаж, бутик 214</div>Пн–Пт 10:00–20:00 · Сб 11:00–20:00 · Вс 11:00–18:00</div>
</div>
<div style="width: 320px; flex: none">${clay.tag("скоро", "#B8FFE2", "#5EE6B0", "#26B985", "#0B3A28", 8, 2)}</div>
</div>`]);

const FW = 1440, FH = 900, GAP = 120, LAB = 50;
const frames = S.map(([title, body], i) => {
  const x = (i % 2) * (FW + GAP) + 60, y = Math.floor(i / 2) * (FH + LAB + GAP) + 60;
  return `<div style="position: absolute; left: ${x}px; top: ${y}px">
<div style="font-weight: 700; font-size: 22px; color: #17133D; margin: 0 0 18px 4px">${i + 1}. ${title}</div>
<div style="position: relative; width: ${FW}px; height: ${FH}px; border-radius: 24px; overflow: hidden; background: #FBFAFF; box-shadow: 0 24px 60px rgba(40,20,110,.12)">${body}</div>
</div>`;
}).join("\n");
const W = 2 * FW + GAP + 120, H = 4 * (FH + LAB + GAP) + 60;
const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Витрина V6 — состояния, компьютер</title>
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
