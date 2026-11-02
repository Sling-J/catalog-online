// Генерирует состояния мастера (T-303), которых нет в AdminPhone2 / AdminDesk2: ошибки полей, проверка адреса,
// загруженный логотип. node gen-admin-setup-states.cjs boards/AdminSetupStates.dc.html
// Шаги собраны так же, как утверждённые экраны мастера; ошибки — по DESIGN.md (рамка coral-underside и подпись).
const fs = require("fs");
const { img, sv, P, C, btn, page } = require("./admin-common.cjs");

const BRAND = "catalog·online";
const progress = (n) => `<div style="display: flex; gap: 6px; padding: 0 16px">${[1, 2, 3, 4].map((i) => `<span style="flex: 1; height: 6px; border-radius: 999px; background: ${i <= n ? C.ink : C.haze}"></span>`).join("")}</div>`;
const bottom = (inner) => `<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 16px 24px; background: linear-gradient(rgba(251,250,255,0), ${C.paper} 30%)">${inner}</div>`;
const backNext = bottom(`<div style="display: flex; gap: 10px">${btn(sv(P.back, C.ink, 18, 2.4), "soft", "width: 52px; padding: 0")}${btn("Дальше", "dark", "flex: 1")}</div>`);
const head = (n, title, sub) => `<div style="padding: 20px 0 0">${progress(n)}</div>
<div style="padding: 22px 16px 0"><div style="font-size: 14px; font-weight: 600; color: ${C.quiet}">Шаг ${n} из 4</div>
<div style="font-weight: 800; font-size: 28px; letter-spacing: -0.03em; line-height: 1.1; margin-top: 6px">${title}</div>
<div style="font-size: 15px; line-height: 1.5; color: ${C.soft}; margin-top: 8px">${sub}</div>`;
const big = (inner, border) => `<div style="margin-top: 22px; display: flex; align-items: center; height: 56px; padding: 0 16px; border-radius: 18px; background: #ffffff; border: 2px solid ${border}; font-size: 17px">${inner}</div>`;
const err = (t, mt = 8) => `<div style="margin-top: ${mt}px; font-size: 13px; color: ${C.coral}">${t}</div>`;
const rules = `<div style="margin-top: 14px; font-size: 13px; line-height: 1.5; color: ${C.muted}">Латиница, цифры и дефис, от 3 до 30 символов. Придумали по названию — можно поменять.</div>`;
// как на утверждённых шагах 2 и 3 (AdminPhone2): превью ссылки и пример сообщения
const linkCard = `<div style="margin-top: 26px; padding: 14px; border-radius: 20px; background: ${C.mist}"><div style="font-size: 13px; font-weight: 600; color: ${C.quiet}">Так ссылка будет выглядеть в WhatsApp</div>
<div style="display: flex; gap: 10px; margin-top: 10px; padding: 10px; border-radius: 14px; background: #ffffff"><span style="width: 52px; height: 52px; border-radius: 10px; flex: none; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 18px; display: flex; align-items: center; justify-content: center">АK</span><div style="font-size: 13px; line-height: 1.4"><b>Айгерим Kids — каталог</b><div style="color: ${C.quiet}">aigerim-kids.[сервис].kz</div></div></div></div>`;
const waCard = `<div style="margin-top: 22px; padding: 16px; border-radius: 20px; background: #E6FBF2; color: ${C.mintInk}"><div style="display: flex; align-items: center; gap: 8px; font-weight: 700">${sv(P.wa, C.mintInk, 20)}Пример сообщения</div>
<div style="margin-top: 10px; padding: 12px 14px; border-radius: 16px 16px 16px 4px; background: #ffffff; font-size: 14px; line-height: 1.5; color: ${C.ink}">Здравствуйте! Заказ с сайта Айгерим Kids:<br>1. Куртка демисезонная (Рост: 110) × 1 — 18 900 ₸<br>Итого: 18 900 ₸</div></div>
<div style="margin-top: 14px; font-weight: 700; font-size: 15px; color: ${C.violet}">Отправить себе тестовое сообщение</div>`;
const logoImg = (s) => `<img src="${img("beanies")}" alt="" style="width: ${s}px; height: ${s}px; border-radius: 50%; object-fit: cover; flex: none">`;

const PH = [];
PH.push(["Шаг 1 — название не введено", head(1, "Как называется магазин?", "Так его увидят покупатели в шапке витрины и в превью ссылки.") +
  big(`<span style="margin-left: 0; width: 2px; height: 22px; background: ${C.ink}"></span>`, C.coral) + err("Введите название магазина", 10) +
  `<div style="margin-top: 26px; padding: 14px; border-radius: 20px; background: ${C.mist}"><div style="font-size: 13px; font-weight: 600; color: ${C.quiet}">Шапка витрины</div>
<div style="display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 12px; border-radius: 16px; background: #ffffff"><span style="width: 40px; height: 40px; border-radius: 50%; border: 1.5px dashed #C9C3E3; flex: none"></span><div><div style="font-weight: 800; font-size: 16px; color: ${C.muted}">Название магазина</div><div style="font-size: 12px; color: ${C.quiet}">адрес и график добавите потом</div></div></div></div>
</div>` + bottom(btn("Дальше", "dark", "width: 100%"))]);
PH.push(["Шаг 2 — проверяем адрес", head(2, "Адрес вашей витрины", "По этой ссылке покупатели откроют каталог. Её можно поставить в Instagram.") +
  big(`<b>aigerim-kids</b><span style="color: ${C.muted}">.[сервис].kz</span>`, C.ink) +
  `<div style="margin-top: 8px; font-size: 13px; font-weight: 600; color: ${C.muted}">Проверяем…</div>${rules}${linkCard}</div>` + backNext]);
PH.push(["Шаг 2 — адрес занят", head(2, "Адрес вашей витрины", "По этой ссылке покупатели откроют каталог. Её можно поставить в Instagram.") +
  big(`<b>aigerim-kids</b><span style="color: ${C.muted}">.[сервис].kz</span>`, C.coral) + err("Этот адрес уже занят — попробуйте другой") + rules + linkCard + `</div>` + backNext]);
PH.push(["Шаг 3 — неверный номер", head(3, "Куда присылать заказы?", "Покупатель нажмёт «Заказать», и у него откроется чат с этим номером и готовым списком товаров.") +
  `<div style="margin-top: 22px; display: flex; gap: 8px"><span style="height: 56px; padding: 0 14px; border-radius: 18px; background: #ffffff; border: 1.5px solid #E2DFF0; display: flex; align-items: center; font-size: 17px; font-weight: 600">+7</span><span style="flex: 1; height: 56px; padding: 0 16px; border-radius: 18px; background: #ffffff; border: 2px solid ${C.coral}; display: flex; align-items: center; font-size: 17px; font-variant-numeric: tabular-nums">700 000 00</span></div>` +
  err("Номер — 10 цифр после +7") + waCard + `</div>` + backNext]);
PH.push(["Шаг 4 — логотип загружен", head(4, "Логотип магазина", "Покажем его в шапке витрины и в превью ссылки. Можно пропустить — пока поставим буквы из названия.") +
  `<div style="margin-top: 24px; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 26px 16px; border-radius: 26px; border: 2px dashed #C9C3E3; background: #F8F7FD">
${logoImg(104)}
<div style="display: flex; gap: 8px">${btn(sv(P.cam, C.ink, 18) + "Снять", "soft", "height: 44px; font-size: 14px; padding: 0 16px")}${btn(sv(P.img, C.ink, 18) + "Из галереи", "soft", "height: 44px; font-size: 14px; padding: 0 16px")}</div>
<div style="font-size: 12px; color: ${C.muted}">PNG или JPG, квадрат от 400 px</div></div>
</div>` + bottom(`<div style="display: flex; gap: 10px">${btn("Пропустить", "line", "flex: none")}${btn("Готово, к товарам →", "sun", "flex: 1")}</div>`)]);

// ───── Компьютер: те же части, что wizard() в gen-admin-desk2.cjs ─────
const phone = (logo) => `<div style="width: 320px; height: 660px; border-radius: 44px; padding: 10px; box-sizing: border-box; background: rgba(255,255,255,.6); border: 1px solid rgba(255,255,255,.9); box-shadow: 0 40px 90px rgba(40,20,110,.28)"><div style="width: 100%; height: 100%; border-radius: 34px; overflow: hidden; background: ${C.paper}">
<div style="padding: 14px 12px 10px; border-bottom: 1px solid ${C.line}"><div style="display: flex; align-items: center; gap: 8px">${logo}<div><div style="font-weight: 800; font-size: 14px">Айгерим Kids</div><div style="font-size: 10px; color: ${C.quiet}">адрес и график добавите потом</div></div></div>
<div style="margin-top: 10px; height: 34px; border-radius: 12px; background: ${C.haze}"></div>
<div style="display: flex; gap: 6px; margin-top: 10px">${["Все", "Куртки", "Платья", "Обувь"].map((c, i) => `<span style="height: 28px; padding: 0 10px; border-radius: 999px; display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; background: ${i ? C.haze : C.ink}; color: ${i ? C.ink : "#ffffff"}">${c}</span>`).join("")}</div></div>
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 8px">${["jacket", "dressR", "sneakers", "beanie", "raincoat", "denim", "hoodie", "tshirt", "dressY", "pink", "coat", "beanies"].map((k) => `<img src="${img(k)}" alt="" style="width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block">`).join("")}</div></div></div>`;
const dashed = `<span style="width: 36px; height: 36px; border-radius: 50%; border: 1.5px dashed #C9C3E3"></span>`;
const preview = (logo) => `<div style="flex: 1; position: relative; background: ${C.lilac}; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden">
<div aria-hidden="true" style="position: absolute; left: -80px; top: -60px; width: 360px; height: 360px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.7), rgba(255,255,255,0) 68%)"></div><div style="position: relative; font-size: 14px; font-weight: 700; color: ${C.ink}; margin-bottom: 18px; padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,.6)">Так увидят покупатели</div><div style="position: relative">${phone(logo)}</div></div>`;
const brand = `<div style="display: flex; align-items: center; gap: 10px"><span style="width: 40px; height: 40px; border-radius: 14px; background: ${C.lilac}; display: flex; align-items: center; justify-content: center">${sv(P.shop, C.ink, 22)}</span><span style="font-weight: 800; font-size: 18px">${BRAND}</span></div>`;
const wizard = (n, title, sub, body, last, logo) => `<div style="position: absolute; inset: 0; display: flex">
<div style="width: 640px; padding: 48px 64px; box-sizing: border-box; background: #ffffff">${brand}
<div style="display: flex; gap: 6px; margin-top: 56px">${[1, 2, 3, 4].map((i) => `<span style="flex: 1; height: 6px; border-radius: 999px; background: ${i <= n ? C.ink : C.haze}"></span>`).join("")}</div>
<div style="font-size: 14px; font-weight: 600; color: ${C.quiet}; margin-top: 28px">Шаг ${n} из 4</div>
<div style="font-weight: 800; font-size: 38px; letter-spacing: -0.03em; line-height: 1.1; margin-top: 8px">${title}</div>
<div style="font-size: 16px; line-height: 1.55; color: ${C.soft}; margin-top: 10px">${sub}</div>
${body}
<div style="display: flex; gap: 10px; margin-top: 40px">${n > 1 ? btn(sv(P.back, C.ink, 18, 2.4) + "Назад", "soft") : ""}<span style="flex: 1"></span>${last || btn("Дальше →", "dark")}</div>
</div>${preview(logo)}</div>`;
const bigD = (inner, border) => `<div style="margin-top: 30px; display: flex; align-items: center; height: 60px; padding: 0 18px; border-radius: 18px; background: #ffffff; border: 2px solid ${border}; font-size: 18px">${inner}</div>`;

const DK = [];
DK.push(["Шаг 2 — адрес занят", wizard(2, "Адрес вашей витрины", "По этой ссылке покупатели откроют каталог. Её можно поставить в Instagram.",
  bigD(`<b>aigerim-kids</b><span style="color: ${C.muted}">.[сервис].kz</span>`, C.coral) +
  `<div style="margin-top: 10px; font-size: 14px; color: ${C.coral}">Этот адрес уже занят — попробуйте другой</div>
<div style="margin-top: 8px; font-size: 14px; line-height: 1.5; color: ${C.muted}">Латиница, цифры и дефис, от 3 до 30 символов. Придумали по названию — можно поменять.</div>`, "", dashed)]);
DK.push(["Шаг 4 — логотип загружен", wizard(4, "Логотип магазина", "Покажем его в шапке витрины и в превью ссылки. Можно пропустить — пока поставим буквы из названия.",
  `<div style="display: flex; align-items: center; gap: 20px; margin-top: 32px; padding: 22px; border-radius: 26px; border: 2px dashed #C9C3E3; background: #F8F7FD">
${logoImg(96)}
<div><div style="font-weight: 700; font-size: 16px">Перетащите картинку сюда</div><div style="font-size: 14px; color: ${C.quiet}; margin-top: 4px">или <b style="color: ${C.violet}">выберите файл</b> · PNG, JPG, квадрат от 400 px</div></div></div>`,
  btn("Пропустить", "line") + btn("Готово, к товарам →", "sun"), logoImg(36))]);

const COLW = 430;
const phoneRow = PH.map(([t, b], i) => `<div style="position: absolute; left: ${i * COLW + 40}px; top: 40px"><div style="font-weight: 700; font-size: 17px; margin: 0 0 14px 4px">${i + 1}. ${t}</div><div style="position: relative; width: 390px; height: 844px; border-radius: 40px; overflow: hidden; background: ${C.paper}; box-shadow: 0 24px 60px rgba(40,20,110,.14)">${b}</div></div>`).join("\n");
const FW = 1440, FH = 900, GAP = 120;
const deskRow = DK.map(([t, b], i) => `<div style="position: absolute; left: ${i * (FW + GAP) + 40}px; top: 1000px"><div style="font-weight: 700; font-size: 22px; margin: 0 0 18px 4px">${PH.length + i + 1}. ${t}</div><div style="position: relative; width: ${FW}px; height: ${FH}px; border-radius: 24px; overflow: hidden; background: ${C.paper}; box-shadow: 0 24px 60px rgba(40,20,110,.12)">${b}</div></div>`).join("\n");
const W = Math.max(PH.length * COLW + 40, DK.length * (FW + GAP) + 40), H = 1000 + 50 + FH + 60;
fs.writeFileSync(process.argv[2], page("Админка — состояния мастера", W, H, phoneRow + "\n" + deskRow));
console.log("size", W, H);
