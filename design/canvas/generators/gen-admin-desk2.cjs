// Генерирует AdminDesk2.dc.html — мастер, новый товар, «О магазине» на компьютере (3 экрана 1440×900)
const fs = require("fs");
const { img, sv, P, C, pill, dot, btn, field, toggle, thumb, page } = require("./admin-common.cjs");

const NAV = [["products", "Товары", "214"], ["import", "Импорт"], ["shop", "Магазин"]];
const side = (active) => `<div style="position: absolute; left: 0; top: 0; bottom: 0; width: 248px; padding: 22px 16px; box-sizing: border-box; background: ${C.lilac}; display: flex; flex-direction: column">
<div style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 20px; background: rgba(255,255,255,.55)"><span style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center">АK</span><div><div style="font-weight: 700; font-size: 15px">Айгерим Kids</div><div style="display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: ${C.inS}">${dot(C.inS)}Опубликован</div></div></div>
<div style="display: flex; flex-direction: column; gap: 4px; margin-top: 22px">${NAV.map(([k, l, n]) => { const on = k === active; return `<div style="display: flex; align-items: center; gap: 12px; height: 48px; padding: 0 14px; border-radius: 16px; font-size: 15px; font-weight: ${on ? 700 : 600}; ${on ? "background: #ffffff; box-shadow: 0 3px 0 rgba(90,70,190,.25)" : ""}">${sv(P[k], C.ink, 20, on ? 2.2 : 1.8)}<span style="flex: 1">${l}</span>${n ? `<span style="min-width: 22px; height: 22px; padding: 0 7px; box-sizing: border-box; border-radius: 999px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,.6)">${n}</span>` : ""}</div>`; }).join("")}</div>
<span style="flex: 1"></span>
<div style="padding: 14px; border-radius: 20px; background: rgba(255,255,255,.55); font-size: 13px"><div style="font-weight: 600; color: ${C.quiet}">Ваша витрина</div><div style="font-weight: 700; margin-top: 2px">aigerim-kids.[сервис].kz</div><div style="display: flex; gap: 6px; margin-top: 10px"><span style="flex: 1; height: 36px; border-radius: 12px; background: ${C.ink}; color: #ffffff; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px">${sv(P.ext, "#ffffff", 14)}Открыть</span><span style="width: 36px; height: 36px; border-radius: 12px; background: #ffffff; display: flex; align-items: center; justify-content: center">${sv(P.copy, C.ink, 16)}</span></div></div>
</div>`;
const main = (inner) => `<div style="position: absolute; left: 248px; top: 0; right: 0; bottom: 0; background: ${C.paper}">${inner}</div>`;
const h1 = (t, right = "") => `<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px"><div style="font-weight: 800; font-size: 30px; letter-spacing: -0.03em">${t}</div><div style="display: flex; gap: 10px; align-items: center">${right}</div></div>`;
const smallBtn = (t, kind = "line") => btn(t, kind, "height: 44px; font-size: 14px; padding: 0 18px");

// Мини-витрина в телефоне — живое превью
const phone = (logo = true, scale = 1) => `<div style="width: ${320 * scale}px; height: ${660 * scale}px; border-radius: ${44 * scale}px; padding: ${10 * scale}px; box-sizing: border-box; background: rgba(255,255,255,.6); border: 1px solid rgba(255,255,255,.9); box-shadow: 0 40px 90px rgba(40,20,110,.28)"><div style="width: 100%; height: 100%; border-radius: ${34 * scale}px; overflow: hidden; background: ${C.paper}">
<div style="padding: ${14 * scale}px ${12 * scale}px ${10 * scale}px; border-bottom: 1px solid ${C.line}"><div style="display: flex; align-items: center; gap: 8px">${logo ? `<span style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 12px; display: flex; align-items: center; justify-content: center">АK</span>` : `<span style="width: 36px; height: 36px; border-radius: 50%; border: 1.5px dashed #C9C3E3"></span>`}<div><div style="font-weight: 800; font-size: 14px">Айгерим Kids</div><div style="font-size: 10px; color: ${C.quiet}">ТЦ «Мега», 2 этаж · <span style="color: ${C.inS}">Открыто до 20:00</span></div></div></div>
<div style="margin-top: 10px; height: 34px; border-radius: 12px; background: ${C.haze}"></div>
<div style="display: flex; gap: 6px; margin-top: 10px">${["Все", "Куртки", "Платья", "Обувь"].map((c, i) => `<span style="height: 28px; padding: 0 10px; border-radius: 999px; display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; background: ${i ? C.haze : C.ink}; color: ${i ? C.ink : "#ffffff"}">${c}</span>`).join("")}</div></div>
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 8px">${["jacket", "dressR", "sneakers", "beanie", "raincoat", "denim", "hoodie", "tshirt", "dressY", "pink", "coat", "beanies"].map((k) => `<img src="${img(k)}" alt="" style="width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block">`).join("")}</div></div></div>`;
const S = [];

// Регистрация и мастер 1–4 на компьютере: форма слева, справа превью витрины
const brand = `<div style="display: flex; align-items: center; gap: 10px"><span style="width: 40px; height: 40px; border-radius: 14px; background: ${C.lilac}; display: flex; align-items: center; justify-content: center">${sv(P.shop, C.ink, 22)}</span><span style="font-weight: 800; font-size: 18px">catalog·online</span></div>`;
const right = (inner) => `<div style="flex: 1; position: relative; background: ${C.lilac}; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden">
<div aria-hidden="true" style="position: absolute; left: -80px; top: -60px; width: 360px; height: 360px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.7), rgba(255,255,255,0) 68%)"></div>${inner}</div>`;
const preview = (logo) => right(`<div style="position: relative; font-size: 14px; font-weight: 700; color: ${C.ink}; margin-bottom: 18px; padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,.6)">Так увидят покупатели</div><div style="position: relative">${phone(logo)}</div>`);
const wizard = (n, title, sub, body, last) => `<div style="position: absolute; inset: 0; display: flex">
<div style="width: 640px; padding: 48px 64px; box-sizing: border-box; background: #ffffff">${brand}
<div style="display: flex; gap: 6px; margin-top: 56px">${[1, 2, 3, 4].map((i) => `<span style="flex: 1; height: 6px; border-radius: 999px; background: ${i <= n ? C.ink : C.haze}"></span>`).join("")}</div>
<div style="font-size: 14px; font-weight: 600; color: ${C.quiet}; margin-top: 28px">Шаг ${n} из 4</div>
<div style="font-weight: 800; font-size: 38px; letter-spacing: -0.03em; line-height: 1.1; margin-top: 8px">${title}</div>
<div style="font-size: 16px; line-height: 1.55; color: ${C.soft}; margin-top: 10px">${sub}</div>
${body}
<div style="display: flex; gap: 10px; margin-top: 40px">${n > 1 ? btn(sv(P.back, C.ink, 18, 2.4) + "Назад", "soft") : ""}<span style="flex: 1"></span>${last || btn("Дальше →", "dark")}</div>
</div>${preview(n === 4)}</div>`;
const bigInput = (inner, border = C.ink) => `<div style="margin-top: 30px; display: flex; align-items: center; height: 60px; padding: 0 18px; border-radius: 18px; background: #ffffff; border: 2px solid ${border}; font-size: 18px">${inner}</div>`;

// 1. Регистрация
S.push(["Регистрация", `<div style="position: absolute; inset: 0; display: flex">
<div style="width: 640px; padding: 48px 64px; box-sizing: border-box; background: #ffffff">${brand}
<div style="font-weight: 800; font-size: 42px; letter-spacing: -0.035em; line-height: 1.08; margin-top: 90px">Создайте каталог магазина</div>
<div style="font-size: 17px; line-height: 1.55; color: ${C.soft}; margin-top: 12px">Бесплатно на время пилота. Понадобятся почта и номер WhatsApp.</div>
<div style="display: flex; flex-direction: column; gap: 16px; margin-top: 34px">${field("Email", "aigerim.kids@mail.kz")}${field("Пароль", "••••••••••", `<span style="color: ${C.inS}">надёжный</span>`)}</div>
<div style="margin-top: 26px">${btn("Создать каталог", "sun", "width: 100%")}</div>
<div style="margin-top: 14px; font-size: 14px; color: ${C.muted}; text-align: center">Пришлём письмо для подтверждения почты</div>
<div style="margin-top: 40px; text-align: center; font-size: 15px">Уже есть каталог? <b style="color: ${C.violet}">Войти</b></div>
</div>${right(`<div style="position: relative; width: 460px">
<div style="font-weight: 800; font-size: 30px; letter-spacing: -0.03em; line-height: 1.15">Покупатели видят размеры и наличие сами — и пишут вам уже с готовым заказом</div>
<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 28px">${[["1", "Загрузите товары из Excel или добавьте вручную"], ["2", "Сфотографируйте товары с телефона"], ["3", "Поделитесь ссылкой в Instagram и WhatsApp"]].map(([n, t]) => `<div style="display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 20px; background: rgba(255,255,255,.6)"><span style="width: 36px; height: 36px; border-radius: 50%; flex: none; background: ${C.sun}; box-shadow: 0 3px 0 ${C.sunU}; display: flex; align-items: center; justify-content: center; font-weight: 800">${n}</span><span style="font-weight: 600; font-size: 16px">${t}</span></div>`).join("")}</div></div>`)}</div>`]);

// 2. Шаг 1 — название
S.push(["Настройка, шаг 1 из 4: название", wizard(1, "Как называется магазин?", "Так его увидят покупатели в шапке витрины и в превью ссылки.",
  bigInput(`<b>Айгерим Kids</b><span style="margin-left: 2px; width: 2px; height: 24px; background: ${C.ink}"></span>`) +
  `<div style="margin-top: 10px; font-size: 14px; color: ${C.muted}">Можно поменять в любой момент в настройках.</div>`)]);

// 3. Шаг 2 — адрес
S.push(["Настройка, шаг 2 из 4: адрес витрины", wizard(2, "Адрес вашей витрины", "По этой ссылке покупатели откроют каталог. Её можно поставить в Instagram.",
  bigInput(`<b>aigerim-kids</b><span style="color: ${C.muted}">.[сервис].kz</span><span style="margin-left: auto">${sv(P.check, C.inS, 22, 2.8)}</span>`, C.inS) +
  `<div style="margin-top: 10px; font-size: 14px; font-weight: 600; color: ${C.inS}">Адрес свободен</div>
<div style="margin-top: 8px; font-size: 14px; line-height: 1.5; color: ${C.muted}">Латиница, цифры и дефис, от 3 до 30 символов. Придумали по названию — можно поменять.</div>`)]);

// 4. Шаг 3 — WhatsApp
S.push(["Настройка, шаг 3 из 4: WhatsApp", wizard(3, "Куда присылать заказы?", "Покупатель нажмёт «Заказать», и у него откроется чат с этим номером и готовым списком товаров.",
  `<div style="margin-top: 30px; display: flex; gap: 10px"><span style="height: 60px; padding: 0 18px; border-radius: 18px; border: 1.5px solid #E2DFF0; display: flex; align-items: center; font-size: 18px; font-weight: 600">+7</span><span style="flex: 1; height: 60px; padding: 0 18px; border-radius: 18px; border: 2px solid ${C.ink}; display: flex; align-items: center; font-size: 18px; font-variant-numeric: tabular-nums">700 000 00 00</span></div>
<div style="margin-top: 18px; padding: 16px; border-radius: 20px; background: #E6FBF2; color: ${C.mintInk}"><div style="display: flex; align-items: center; gap: 8px; font-weight: 700">${sv(P.wa, C.mintInk, 20)}Пример сообщения</div>
<div style="margin-top: 10px; padding: 12px 14px; border-radius: 16px 16px 16px 4px; background: #ffffff; font-size: 14px; line-height: 1.5; color: ${C.ink}">Здравствуйте! Заказ с сайта Айгерим Kids:<br>1. Куртка демисезонная (Рост: 110) × 1 — 18 900 ₸<br>Итого: 18 900 ₸</div></div>
<div style="margin-top: 12px; font-weight: 700; font-size: 15px; color: ${C.violet}">Отправить себе тестовое сообщение</div>`)]);

// 5. Шаг 4 — логотип
S.push(["Настройка, шаг 4 из 4: логотип", wizard(4, "Логотип магазина", "Покажем его в шапке витрины и в превью ссылки. Можно пропустить — пока поставим буквы из названия.",
  `<div style="display: flex; align-items: center; gap: 20px; margin-top: 32px; padding: 22px; border-radius: 26px; border: 2px dashed #C9C3E3; background: #F8F7FD">
<span style="width: 96px; height: 96px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 32px; display: flex; align-items: center; justify-content: center; flex: none">АK</span>
<div><div style="font-weight: 700; font-size: 16px">Перетащите картинку сюда</div><div style="font-size: 14px; color: ${C.quiet}; margin-top: 4px">или <b style="color: ${C.violet}">выберите файл</b> · PNG, JPG, квадрат от 400 px</div></div></div>`,
  btn("Пропустить", "line") + btn("Готово, к товарам →", "sun"))]);

// 2. Новый товар
const sr = (v, price, qty) => `<div style="display: grid; grid-template-columns: 90px 1fr 160px 150px 200px 30px; gap: 12px; align-items: center; padding: 8px 18px; border-top: 1px solid #F0EEF7; font-size: 15px; font-variant-numeric: tabular-nums"><span style="height: 40px; border-radius: 12px; background: ${C.ink}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700">${v}</span><span style="color: ${C.muted}; font-size: 13px">авто</span><span style="height: 40px; padding: 0 12px; border-radius: 12px; border: 1.5px solid #E2DFF0; display: flex; align-items: center; color: ${C.muted}">${price}</span><span style="height: 40px; border-radius: 12px; border: 1.5px solid #E2DFF0; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-weight: 600"><span style="color: ${C.muted}">−</span>${qty}<span style="color: ${C.muted}">+</span></span><span style="height: 40px; padding: 0 12px; border-radius: 12px; border: 1.5px dashed #E2DFF0; display: flex; align-items: center; color: ${C.muted}; font-size: 13px">необязательно</span>${sv(P.x, C.muted, 16)}</div>`;
S.push(["Новый товар вручную", side("products") + main(`<div style="padding: 24px 32px">
<div style="font-size: 14px; color: ${C.quiet}">Товары / Новый</div>
<div style="margin-top: 6px">${h1("Новый товар", smallBtn("Сохранить черновик", "soft") + btn("Сохранить и показать", "dark", "height: 44px; font-size: 14px"))}</div>
<div style="display: flex; gap: 28px; margin-top: 18px">
<div style="width: 340px; flex: none"><div style="position: relative">${thumb("dressY", 340, 24)}<span style="position: absolute; left: 12px; top: 12px">${pill("Обложка", "rgba(255,255,255,.92)", C.ink)}</span></div>
<div style="margin-top: 8px; height: 110px; border-radius: 20px; border: 2px dashed #C9C3E3; background: #F8F7FD; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font-size: 14px; color: ${C.quiet}">${sv(P.img, C.quiet, 26)}<span><b style="color: ${C.violet}">Добавьте фото</b> или перетащите сюда</span></div></div>
<div style="flex: 1; display: flex; flex-direction: column; gap: 14px">
${field("Название", "Платье летнее")}
<div style="display: grid; grid-template-columns: 1fr 200px; gap: 14px">${field("Категория", "Платья " + sv(P.down, C.quiet, 14, 2.4))}${field("Цена, ₸", "8 200", `<span style="color: ${C.muted}">для всех размеров</span>`)}</div>
${field("Описание", '<span style="color: ' + C.muted + '">Ткань, посадка, уход — то, что спрашивают в WhatsApp</span>', `<span style="color: ${C.muted}">необязательно</span>`)}
<div style="border-radius: 20px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}, 0 6px 16px rgba(40,30,110,.05); overflow: hidden">
<div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px"><span style="font-weight: 700; font-size: 15px">Размеры и количество</span><span style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: ${C.quiet}">Свойство <span style="height: 32px; padding: 0 12px; border-radius: 999px; background: ${C.haze}; display: inline-flex; align-items: center; gap: 4px; font-weight: 600; color: ${C.ink}">Рост ${sv(P.down, C.quiet, 13, 2.4)}</span></span></div>
<div style="display: grid; grid-template-columns: 90px 1fr 160px 150px 200px 30px; gap: 12px; padding: 0 18px 8px; font-size: 12px; font-weight: 600; color: ${C.quiet}"><span>Рост</span><span>Артикул</span><span>Цена</span><span>Количество</span><span>Штрихкод</span><span></span></div>
${sr("98", "8 200 ₸", 2)}${sr("104", "8 200 ₸", 3)}${sr("110", "8 200 ₸", 1)}
<div style="display: flex; gap: 8px; padding: 12px 18px; border-top: 1px solid #F0EEF7">${["116", "122", "128"].map((v) => `<span style="height: 36px; padding: 0 12px; border-radius: 12px; border: 1.5px dashed #C9C3E3; display: inline-flex; align-items: center; font-size: 14px; font-weight: 600; color: ${C.quiet}">+ ${v}</span>`).join("")}<span style="height: 36px; padding: 0 12px; display: inline-flex; align-items: center; font-size: 14px; font-weight: 600; color: ${C.violet}">Свой размер</span><span style="flex: 1"></span><span style="font-size: 13px; color: ${C.muted}; align-self: center">Артикул придумаем сами, если не указать</span></div>
</div></div></div></div>`)]);

// 3–4. О магазине: две колонки; превью витрины — по кнопке, панелью поверх справа
const DAYGRID = "128px 1fr 16px 1fr 46px";
const tbox = (t, off) => `<span style="height: 40px; border-radius: 12px; border: 1.5px solid #E2DFF0; background: ${off ? "#F6F5FB" : "#ffffff"}; display: flex; align-items: center; justify-content: center; font-size: 15px; font-variant-numeric: tabular-nums; color: ${off ? C.muted : C.ink}">${t}</span>`;
const day = (d, t, today, off) => `<div style="display: grid; grid-template-columns: ${DAYGRID}; gap: 10px; align-items: center; padding: 6px 0; font-size: 15px; ${today ? "font-weight: 700" : ""}"><span>${d}</span>${off ? `<span style="grid-column: 2 / 5; height: 40px; border-radius: 12px; background: #F6F5FB; display: flex; align-items: center; justify-content: center; color: ${C.muted}; font-size: 14px">Выходной</span>` : `${tbox(t[0])}<span style="text-align: center; color: ${C.muted}">—</span>${tbox(t[1])}`}${toggle(!off)}</div>`;
const shopInfo = (withPreview) => side("shop") + main(`<div style="position: absolute; inset: 0; padding: 24px 32px; box-sizing: border-box">
<div style="font-size: 14px; color: ${C.quiet}">Магазин / О магазине</div>
<div style="margin-top: 6px">${h1("О магазине", btn(sv(P.eye, C.ink, 18) + (withPreview ? "Скрыть превью" : "Превью витрины"), withPreview ? "soft" : "line", "height: 44px; font-size: 14px; padding: 0 18px") + btn("Сохранить", "dark", "height: 44px; font-size: 14px"))}</div>
<div style="display: grid; grid-template-columns: 1fr 480px; gap: 32px; margin-top: 18px">
<div style="display: flex; flex-direction: column; gap: 14px">
<div style="display: flex; align-items: center; gap: 14px"><span style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 22px; display: flex; align-items: center; justify-content: center">АK</span><div style="flex: 1">${field("Название", "Айгерим Kids")}</div></div>
${field("Описание", "Одежда и обувь для детей от 1 до 10 лет. Новые поступления каждую неделю.")}
${field("Адрес", "Шымкент, ТЦ «Мега», 2 этаж, бутик 214", `<span style="color: ${C.violet}">ссылка на 2ГИС найдётся сама</span>`)}
${field("Как найти", "Вход со стороны парковки, от эскалатора направо", `<span style="color: ${C.muted}">необязательно</span>`)}
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">${field("WhatsApp", "+7 700 000 00 00")}${field("Instagram", "@aigerim.kids")}</div>
</div>
<div><div style="font-weight: 700; font-size: 15px">График работы</div>
<div style="margin-top: 8px; padding: 10px 18px; border-radius: 22px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}, 0 6px 16px rgba(40,30,110,.05)">
<div style="display: grid; grid-template-columns: ${DAYGRID}; gap: 10px; padding: 4px 0 6px; font-size: 12px; font-weight: 600; color: ${C.quiet}"><span>День</span><span style="text-align: center">Открытие</span><span></span><span style="text-align: center">Закрытие</span><span>Раб.</span></div>
${day("Понедельник", ["10:00", "20:00"])}${day("Вторник", ["10:00", "20:00"])}${day("Среда", ["10:00", "20:00"])}${day("Четверг", ["10:00", "20:00"])}${day("Пятница", ["10:00", "20:00"])}${day("Суббота", ["11:00", "20:00"], true)}${day("Воскресенье", ["11:00", "18:00"])}
<div style="padding: 10px 0 4px; font-size: 13px; font-weight: 600; color: ${C.violet}">Скопировать Пн на все будни</div></div></div>
</div></div>
${withPreview ? `<div style="position: absolute; inset: 0; background: rgba(23,19,61,.18)"></div>
<div style="position: absolute; top: 16px; right: 16px; bottom: 16px; width: 400px; border-radius: 28px; background: ${C.mist}; box-shadow: -20px 0 60px rgba(23,19,61,.22); display: flex; flex-direction: column; align-items: center; justify-content: center">
<div style="position: absolute; left: 20px; right: 16px; top: 16px; display: flex; align-items: center; justify-content: space-between"><span style="font-weight: 700; font-size: 15px">Превью витрины</span><span style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,.75); display: flex; align-items: center; justify-content: center">${sv(P.x, C.ink, 16, 2.4)}</span></div>
<div style="margin-top: 30px">${phone(true, 1)}</div>
<div style="margin-top: 14px; font-size: 13px; color: ${C.quiet}">Несохранённые изменения тоже видны</div></div>` : ""}`);
S.push(["О магазине — две колонки", shopInfo(false)]);
S.push(["О магазине — превью витрины открыто по кнопке", shopInfo(true)]);

const FW = 1440, FH = 900, GAP = 120, LAB = 50;
const body = S.map(([t, b], i) => {
  const ON = 5, col = i < ON ? i : i - ON, row = i < ON ? 0 : 1;
  const x = col * (FW + GAP) + 60, y = row * (FH + LAB + GAP + 18) + 60;
  return `<div style="position: absolute; left: ${x}px; top: ${y}px"><div style="font-weight: 700; font-size: 22px; margin: 0 0 18px 4px">${i + 1}. ${t}</div><div style="position: relative; width: ${FW}px; height: ${FH}px; border-radius: 24px; overflow: hidden; background: ${C.paper}; box-shadow: 0 24px 60px rgba(40,20,110,.12)">${b}</div></div>`;
}).join("\n");
const W = 5 * (FW + GAP), H = 2 * (FH + LAB + 18) + GAP + 2 * 60;
fs.writeFileSync(process.argv[2], page("Админка — компьютер, остальные экраны", W, H, body));
console.log("size", W, H);
