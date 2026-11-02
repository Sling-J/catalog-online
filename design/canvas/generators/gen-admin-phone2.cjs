// Генерирует AdminPhone2.dc.html — остальные экраны админки на телефоне (10 экранов 390×844)
const fs = require("fs");
const { img, sv, P, C, pill, dot, btn, field, toggle, thumb, page } = require("./admin-common.cjs");

const NAV = [["products", "Товары"], ["import", "Импорт"], ["shop", "Магазин"]];
const nav = (active) => `<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 84px; padding: 8px 10px 0; box-sizing: border-box; background: ${C.lilac}; border-radius: 26px 26px 0 0; display: flex; gap: 4px">
${NAV.map(([k, l]) => { const on = k === active; return `<div style="flex: 1; height: 56px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; ${on ? "background: #ffffff; box-shadow: 0 3px 0 rgba(90,70,190,.25)" : ""}; font-size: 12px; font-weight: ${on ? 700 : 600}">${sv(P[k], C.ink, 22, on ? 2.2 : 1.8)}${l}</div>`; }).join("")}
</div>`;
const top = (status = "Опубликован", on = true) => `<div style="display: flex; align-items: center; gap: 10px; padding: 14px 16px 0">
<span style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; flex: none">АK</span>
<div style="flex: 1"><div style="font-weight: 700; font-size: 15px">Айгерим Kids</div><div style="display: flex; align-items: center; gap: 5px; font-size: 12px; color: ${on ? C.inS : C.lowS}; font-weight: 600">${dot(on ? C.inS : "#E8A100")}${status}</div></div>
<span style="height: 36px; display: inline-flex; align-items: center; gap: 6px; padding: 0 12px; border-radius: 999px; background: ${C.haze}; font-weight: 600; font-size: 13px">${sv(P.ext, C.ink, 15)}Витрина</span></div>`;
const title = (t, right = "") => `<div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 16px 0"><div style="font-weight: 800; font-size: 28px; letter-spacing: -0.03em">${t}</div>${right}</div>`;
const backBar = (t, right = "") => `<div style="display: flex; align-items: center; gap: 10px; padding: 14px 16px 0"><span style="width: 44px; height: 44px; border-radius: 50%; background: ${C.haze}; display: flex; align-items: center; justify-content: center; flex: none">${sv(P.back, C.ink, 20, 2.4)}</span><div style="flex: 1; font-weight: 800; font-size: 20px">${t}</div>${right}</div>`;
const bottom = (inner, nb = 24) => `<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 16px ${nb}px; background: linear-gradient(rgba(251,250,255,0), ${C.paper} 30%)">${inner}</div>`;
const label = (t, extra = "") => `<div style="font-weight: 700; font-size: 15px; ${extra}">${t}</div>`;
const progress = (n) => `<div style="display: flex; gap: 6px; padding: 0 16px">${[1, 2, 3, 4].map((i) => `<span style="flex: 1; height: 6px; border-radius: 999px; background: ${i <= n ? C.ink : C.haze}"></span>`).join("")}</div>`;
const S = [];

// 1. Регистрация
S.push(["Регистрация", `<div style="padding: 40px 24px 0">
<div style="display: flex; align-items: center; gap: 10px"><span style="width: 40px; height: 40px; border-radius: 14px; background: ${C.lilac}; display: flex; align-items: center; justify-content: center">${sv(P.shop, C.ink, 22)}</span><span style="font-weight: 800; font-size: 18px">catalog·online</span></div>
<div style="font-weight: 800; font-size: 32px; letter-spacing: -0.03em; line-height: 1.1; margin-top: 40px">Создайте каталог магазина</div>
<div style="font-size: 16px; line-height: 1.5; color: ${C.soft}; margin-top: 10px">Бесплатно на время пилота. Понадобятся почта и номер WhatsApp.</div>
<div style="display: flex; flex-direction: column; gap: 14px; margin-top: 30px">
${field("Email", "aigerim.kids@mail.kz")}
${field("Пароль", "••••••••••", `<span style="color: ${C.inS}">надёжный</span>`)}
</div>
<div style="margin-top: 24px">${btn("Создать каталог", "sun", "width: 100%")}</div>
<div style="margin-top: 14px; font-size: 13px; line-height: 1.5; color: ${C.muted}; text-align: center">Пришлём письмо для подтверждения почты</div>
<div style="margin-top: 40px; text-align: center; font-size: 15px">Уже есть каталог? <b style="color: ${C.violet}">Войти</b></div>
</div>`]);

// 1б. Мастер, шаг 1 — название
S.push(["Настройка, шаг 1 из 4: название", `<div style="padding: 20px 0 0">${progress(1)}</div>
<div style="padding: 22px 16px 0"><div style="font-size: 14px; font-weight: 600; color: ${C.quiet}">Шаг 1 из 4</div>
<div style="font-weight: 800; font-size: 28px; letter-spacing: -0.03em; line-height: 1.1; margin-top: 6px">Как называется магазин?</div>
<div style="font-size: 15px; line-height: 1.5; color: ${C.soft}; margin-top: 8px">Так его увидят покупатели в шапке витрины и в превью ссылки.</div>
<div style="margin-top: 22px; display: flex; align-items: center; height: 56px; padding: 0 16px; border-radius: 18px; background: #ffffff; border: 2px solid ${C.ink}; font-size: 17px"><b>Айгерим Kids</b><span style="margin-left: 2px; width: 2px; height: 22px; background: ${C.ink}"></span></div>
<div style="margin-top: 10px; font-size: 13px; color: ${C.muted}">Можно поменять в любой момент в настройках.</div>
<div style="margin-top: 26px; padding: 14px; border-radius: 20px; background: ${C.mist}"><div style="font-size: 13px; font-weight: 600; color: ${C.quiet}">Шапка витрины</div>
<div style="display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 12px; border-radius: 16px; background: #ffffff"><span style="width: 40px; height: 40px; border-radius: 50%; border: 1.5px dashed #C9C3E3; flex: none"></span><div><div style="font-weight: 800; font-size: 16px">Айгерим Kids</div><div style="font-size: 12px; color: ${C.quiet}">адрес и график добавите потом</div></div></div></div>
</div>` + bottom(btn("Дальше", "dark", "width: 100%"))]);

// 2. Мастер, шаг 2 — адрес витрины
S.push(["Настройка, шаг 2 из 4: адрес витрины", `<div style="padding: 20px 0 0">${progress(2)}</div>
<div style="padding: 22px 16px 0"><div style="font-size: 14px; font-weight: 600; color: ${C.quiet}">Шаг 2 из 4</div>
<div style="font-weight: 800; font-size: 28px; letter-spacing: -0.03em; line-height: 1.1; margin-top: 6px">Адрес вашей витрины</div>
<div style="font-size: 15px; line-height: 1.5; color: ${C.soft}; margin-top: 8px">По этой ссылке покупатели откроют каталог. Её можно поставить в Instagram.</div>
<div style="margin-top: 22px; display: flex; align-items: center; height: 56px; padding: 0 16px; border-radius: 18px; background: #ffffff; border: 2px solid ${C.inS}; font-size: 17px"><b>aigerim-kids</b><span style="color: ${C.muted}">.[сервис].kz</span><span style="margin-left: auto">${sv(P.check, C.inS, 20, 2.8)}</span></div>
<div style="margin-top: 8px; font-size: 13px; font-weight: 600; color: ${C.inS}">Адрес свободен</div>
<div style="margin-top: 14px; font-size: 13px; line-height: 1.5; color: ${C.muted}">Латиница, цифры и дефис, от 3 до 30 символов. Придумали по названию — можно поменять.</div>
<div style="margin-top: 26px; padding: 14px; border-radius: 20px; background: ${C.mist}"><div style="font-size: 13px; font-weight: 600; color: ${C.quiet}">Так ссылка будет выглядеть в WhatsApp</div>
<div style="display: flex; gap: 10px; margin-top: 10px; padding: 10px; border-radius: 14px; background: #ffffff">${thumb("jacket", 52, 10)}<div style="font-size: 13px; line-height: 1.4"><b>Айгерим Kids — каталог</b><div style="color: ${C.quiet}">aigerim-kids.[сервис].kz</div></div></div></div>
</div>` + bottom(`<div style="display: flex; gap: 10px">${btn(sv(P.back, C.ink, 18, 2.4), "soft", "width: 52px; padding: 0")}${btn("Дальше", "dark", "flex: 1")}</div>`)]);

// 3. Мастер, шаг 3 — WhatsApp
S.push(["Настройка, шаг 3 из 4: WhatsApp", `<div style="padding: 20px 0 0">${progress(3)}</div>
<div style="padding: 22px 16px 0"><div style="font-size: 14px; font-weight: 600; color: ${C.quiet}">Шаг 3 из 4</div>
<div style="font-weight: 800; font-size: 28px; letter-spacing: -0.03em; line-height: 1.1; margin-top: 6px">Куда присылать заказы?</div>
<div style="font-size: 15px; line-height: 1.5; color: ${C.soft}; margin-top: 8px">Покупатель нажмёт «Заказать», и у него откроется чат с этим номером и готовым списком товаров.</div>
<div style="margin-top: 22px; display: flex; gap: 8px"><span style="height: 56px; padding: 0 14px; border-radius: 18px; background: #ffffff; border: 1.5px solid #E2DFF0; display: flex; align-items: center; font-size: 17px; font-weight: 600">+7</span><span style="flex: 1; height: 56px; padding: 0 16px; border-radius: 18px; background: #ffffff; border: 2px solid ${C.ink}; display: flex; align-items: center; font-size: 17px; font-variant-numeric: tabular-nums">700 000 00 00</span></div>
<div style="margin-top: 22px; padding: 16px; border-radius: 20px; background: #E6FBF2; color: ${C.mintInk}"><div style="display: flex; align-items: center; gap: 8px; font-weight: 700">${sv(P.wa, C.mintInk, 20)}Пример сообщения</div>
<div style="margin-top: 10px; padding: 12px 14px; border-radius: 16px 16px 16px 4px; background: #ffffff; font-size: 14px; line-height: 1.5; color: ${C.ink}">Здравствуйте! Заказ с сайта Айгерим Kids:<br>1. Куртка демисезонная (Рост: 110) × 1 — 18 900 ₸<br>Итого: 18 900 ₸</div></div>
<div style="margin-top: 14px; font-weight: 700; font-size: 15px; color: ${C.violet}">Отправить себе тестовое сообщение</div>
</div>` + bottom(`<div style="display: flex; gap: 10px">${btn(sv(P.back, C.ink, 18, 2.4), "soft", "width: 52px; padding: 0")}${btn("Дальше", "dark", "flex: 1")}</div>`)]);

// 3б. Мастер, шаг 4 — логотип
S.push(["Настройка, шаг 4 из 4: логотип", `<div style="padding: 20px 0 0">${progress(4)}</div>
<div style="padding: 22px 16px 0"><div style="font-size: 14px; font-weight: 600; color: ${C.quiet}">Шаг 4 из 4</div>
<div style="font-weight: 800; font-size: 28px; letter-spacing: -0.03em; line-height: 1.1; margin-top: 6px">Логотип магазина</div>
<div style="font-size: 15px; line-height: 1.5; color: ${C.soft}; margin-top: 8px">Покажем его в шапке витрины и в превью ссылки. Можно пропустить — пока поставим буквы из названия.</div>
<div style="margin-top: 24px; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 26px 16px; border-radius: 26px; border: 2px dashed #C9C3E3; background: #F8F7FD">
<span style="width: 104px; height: 104px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 34px; display: flex; align-items: center; justify-content: center">АK</span>
<div style="display: flex; gap: 8px">${btn(sv(P.cam, C.ink, 18) + "Снять", "soft", "height: 44px; font-size: 14px; padding: 0 16px")}${btn(sv(P.img, C.ink, 18) + "Из галереи", "soft", "height: 44px; font-size: 14px; padding: 0 16px")}</div>
<div style="font-size: 12px; color: ${C.muted}">PNG или JPG, квадрат от 400 px</div></div>
</div>` + bottom(`<div style="display: flex; gap: 10px">${btn("Пропустить", "line", "flex: none")}${btn("Готово, к товарам →", "sun", "flex: 1")}</div>`)]);

// 4. Нет товаров
S.push(["Товаров пока нет", top("Черновик — витрина скрыта", false) + title("Товары") + `<div style="padding: 50px 24px 0; text-align: center">
<div aria-hidden="true" style="width: 96px; height: 120px; margin: 0 auto; transform: rotate(8deg); border-radius: 22px; background: radial-gradient(120% 90% at 30% 15%, #FFF0A8, #FFD23F 55%, #E3AE00); box-shadow: inset -10px -14px 20px rgba(80,40,0,.28), inset 8px 9px 16px rgba(255,255,255,.55), 0 24px 36px rgba(60,30,120,.22)"><div style="width: 18px; height: 18px; border-radius: 50%; margin: 14px auto 0; background: ${C.paper}"></div><div style="font-weight: 800; font-size: 30px; margin-top: 12px; color: #6B4E00">0</div></div>
<div style="font-weight: 800; font-size: 22px; margin-top: 26px">Добавьте первые товары</div>
<div style="font-size: 15px; line-height: 1.5; color: ${C.soft}; margin-top: 8px">Если товары уже есть в Excel или выгрузке из учётной программы — загрузите файл. Если нет — заведите вручную.</div></div>
<div style="display: flex; flex-direction: column; gap: 10px; padding: 26px 16px 0">
<div style="display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 22px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}, 0 6px 16px rgba(40,30,110,.05)"><span style="width: 48px; height: 48px; border-radius: 16px; background: ${C.sun}; display: flex; align-items: center; justify-content: center; flex: none">${sv(P.import, C.ink, 22)}</span><div style="flex: 1"><div style="font-weight: 700; font-size: 16px">Загрузить Excel</div><div style="font-size: 13px; color: ${C.quiet}">Сотни товаров за пару минут</div></div>${sv(P.chev, C.muted, 18, 2.4)}</div>
<div style="display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 22px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}, 0 6px 16px rgba(40,30,110,.05)"><span style="width: 48px; height: 48px; border-radius: 16px; background: ${C.mist}; display: flex; align-items: center; justify-content: center; flex: none">${sv(P.plus, C.ink, 22, 2.4)}</span><div style="flex: 1"><div style="font-weight: 700; font-size: 16px">Добавить вручную</div><div style="font-size: 13px; color: ${C.quiet}">Фото, название, размеры, количество</div></div>${sv(P.chev, C.muted, 18, 2.4)}</div>
</div>` + nav("products")]);

// 5. Новый товар вручную
const sizeRow = (v, price, qty, dim) => `<div style="display: grid; grid-template-columns: 64px 1fr 84px 28px; gap: 8px; align-items: center; padding: 6px 0; font-variant-numeric: tabular-nums"><span style="height: 40px; border-radius: 12px; background: ${C.ink}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px">${v}</span><span style="height: 40px; padding: 0 12px; border-radius: 12px; border: 1.5px solid #E2DFF0; background: #ffffff; display: flex; align-items: center; font-size: 15px; ${dim ? "color: " + C.muted : ""}">${price}</span><span style="height: 40px; border-radius: 12px; border: 1.5px solid #E2DFF0; background: #ffffff; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; font-size: 15px; font-weight: 600"><span style="color: ${C.muted}">−</span>${qty}<span style="color: ${C.muted}">+</span></span>${sv(P.x, C.muted, 16)}</div>`;
S.push(["Новый товар вручную", backBar("Новый товар") + `<div style="padding: 14px 16px 0; display: flex; gap: 8px">${thumb("dressY", 96, 18, "box-shadow: 0 0 0 3px " + C.sun)}<span style="width: 96px; height: 96px; border-radius: 18px; border: 1.5px dashed #C9C3E3; background: #F6F5FB; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 12px; font-weight: 600; color: ${C.quiet}">${sv(P.cam, C.quiet, 22)}Ещё фото</span></div>
<div style="display: flex; flex-direction: column; gap: 12px; padding: 14px 16px 0">
${field("Название", "Платье летнее")}
<div style="display: flex; gap: 8px">${field("Категория", "Платья " + sv(P.down, C.quiet, 14, 2.4), "", "flex: 1")}${field("Цена, ₸", "8 200", "", "width: 120px")}</div>
</div>
<div style="padding: 14px 16px 0"><div style="display: flex; justify-content: space-between; align-items: center">${label("Размеры и количество")}<span style="height: 32px; padding: 0 12px; border-radius: 999px; background: ${C.haze}; display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600">Рост ${sv(P.down, C.quiet, 13, 2.4)}</span></div>
<div style="display: grid; grid-template-columns: 64px 1fr 84px 28px; gap: 8px; margin-top: 8px; font-size: 12px; font-weight: 600; color: ${C.quiet}"><span>Рост</span><span>Цена</span><span>Кол-во</span><span></span></div>
${sizeRow("98", "8 200 ₸", 2, true)}${sizeRow("104", "8 200 ₸", 3, true)}${sizeRow("110", "8 200 ₸", 1, true)}
<div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px">${["116", "122", "128"].map((v) => `<span style="height: 36px; padding: 0 12px; border-radius: 12px; border: 1.5px dashed #C9C3E3; display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 600; color: ${C.quiet}">+ ${v}</span>`).join("")}<span style="height: 36px; padding: 0 12px; display: inline-flex; align-items: center; font-size: 14px; font-weight: 600; color: ${C.violet}">Свой размер</span></div>
<div style="margin-top: 8px; font-size: 12px; color: ${C.muted}">Цена у всех размеров одна — поменяйте, если отличается. Без размеров — просто укажите количество.</div></div>
` + bottom(`<div style="display: flex; gap: 10px">${btn("Черновик", "soft", "flex: none")}${btn("Сохранить и показать", "dark", "flex: 1")}</div>`)]);

// 6. Раздел «Магазин»
const mrow = (icon, t, sub, right = sv(P.chev, C.muted, 18, 2.4), bg = C.mist) => `<div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-top: 1px solid #F0EEF7"><span style="width: 40px; height: 40px; border-radius: 13px; background: ${bg}; display: flex; align-items: center; justify-content: center; flex: none">${icon}</span><div style="flex: 1; min-width: 0"><div style="font-weight: 600; font-size: 15px">${t}</div><div style="font-size: 13px; color: ${C.quiet}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${sub}</div></div>${right}</div>`;
S.push(["Раздел «Магазин»", top() + title("Магазин") + `<div style="margin: 14px 16px 0; padding: 16px; border-radius: 22px; background: ${C.mist}">
<div style="display: flex; align-items: center; justify-content: space-between"><div style="font-size: 13px; font-weight: 600; color: ${C.quiet}">Витрина опубликована</div>${pill(dot(C.inS) + "Видна всем", "#E6FBF2", C.mintInk)}</div>
<div style="font-weight: 800; font-size: 18px; margin-top: 6px">aigerim-kids.[сервис].kz</div>
<div style="display: flex; gap: 8px; margin-top: 12px"><span style="flex: 1; height: 42px; border-radius: 14px; background: ${C.ink}; color: #ffffff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 6px">${sv(P.copy, "#ffffff", 16)}Скопировать ссылку</span><span style="height: 42px; padding: 0 14px; border-radius: 14px; background: #ffffff; font-weight: 600; font-size: 14px; display: flex; align-items: center">Снять</span></div></div>
<div style="margin: 14px 16px 0; border-radius: 22px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}; overflow: hidden">
${mrow(sv(P.shop, C.ink, 20), "О магазине", "Описание, адрес, как найти, график, контакты").replace("border-top: 1px solid #F0EEF7", "")}
${mrow(sv(P.products, C.ink, 20), "Категории и размеры", "6 категорий · Рост, Размер обуви")}
${mrow(sv(P.eye, C.ink, 20), "Как показывать наличие", "«есть / мало / нет», мало — 2 и меньше")}
${mrow(sv('<path d="M5 19V11M12 19V5M19 19v-6"></path>', C.ink, 20, 2.4), "Статистика", "За неделю: 1 240 просмотров, 46 нажатий «Заказать»")}
${mrow(sv(P.lock, C.ink, 20), "Вход и пароль", "aigerim.kids@mail.kz")}
</div>
<div style="margin: 16px 16px 0; font-weight: 600; font-size: 15px; color: ${C.coral}; text-align: center">Выйти</div>` + nav("shop")]);

// 7. О магазине — настройки
const day = (d, t, today, off) => `<div style="display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-top: 1px solid #F0EEF7; font-size: 15px; ${today ? "font-weight: 700" : ""}"><span>${d}</span><span style="font-variant-numeric: tabular-nums; color: ${off ? C.muted : C.ink}">${t}</span></div>`;
S.push(["О магазине", backBar("О магазине", `<span style="font-weight: 700; font-size: 15px; color: ${C.violet}">Готово</span>`) + `<div style="display: flex; flex-direction: column; gap: 12px; padding: 16px 16px 0">
<div style="display: flex; align-items: center; gap: 14px"><span style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 22px; display: flex; align-items: center; justify-content: center">АK</span><div><div style="font-weight: 600; font-size: 15px; color: ${C.violet}">Сменить логотип</div><div style="font-size: 12px; color: ${C.muted}">Квадрат, от 400 px</div></div></div>
${field("Описание", "Одежда и обувь для детей от 1 до 10 лет. Новые поступления каждую неделю.")}
${field("Адрес", "Шымкент, ТЦ «Мега», 2 этаж, бутик 214")}
${field("Как найти", "Вход со стороны парковки, от эскалатора направо", `<span style="color: ${C.muted}">необязательно</span>`)}
</div>
<div style="padding: 14px 16px 0"><div style="display: flex; justify-content: space-between">${label("График работы")}<span style="font-size: 13px; font-weight: 600; color: ${C.violet}">Изменить</span></div>
<div style="margin-top: 6px; padding: 0 14px; border-radius: 16px; background: #ffffff; border: 1.5px solid #E2DFF0">${day("Пн–Пт", "10:00–20:00").replace("border-top: 1px solid #F0EEF7;", "")}${day("Суббота", "11:00–20:00", true)}${day("Воскресенье", "11:00–18:00")}</div></div>
<div style="padding: 14px 16px 0">${label("Контакты")}<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px">${field("", "WhatsApp +7 700 000 00 00")}${field("", "Instagram @aigerim.kids")}</div></div>`]);

// 8. Категории и размеры
const cat = (n, c) => `<div style="display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-top: 1px solid #F0EEF7">${sv(P.drag, C.muted, 18, 2.6)}<span style="flex: 1; font-weight: 600; font-size: 15px">${n}</span><span style="font-size: 13px; color: ${C.quiet}">${c}</span></div>`;
S.push(["Категории и размеры", backBar("Категории и размеры") + `<div style="padding: 16px 16px 0"><div style="display: flex; justify-content: space-between">${label("Категории")}<span style="font-size: 14px; font-weight: 600; color: ${C.violet}">+ Категория</span></div>
<div style="font-size: 12px; color: ${C.muted}; margin-top: 2px">В таком порядке они идут на витрине. Перетаскивайте.</div>
<div style="margin-top: 10px; border-radius: 18px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}; overflow: hidden">${cat("Куртки", "38 товаров").replace("border-top: 1px solid #F0EEF7;", "")}${cat("Платья", "42")}${cat("Кофты и футболки", "57")}${cat("Обувь", "44")}${cat("Шапки", "33")}</div></div>
<div style="padding: 18px 16px 0"><div style="display: flex; justify-content: space-between">${label("Размеры и другие свойства")}<span style="font-size: 14px; font-weight: 600; color: ${C.violet}">+ Свойство</span></div>
<div style="margin-top: 10px; padding: 14px; border-radius: 18px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}">
<div style="display: flex; align-items: center; justify-content: space-between"><span style="font-weight: 700; font-size: 15px">Рост</span><span style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${C.quiet}">в фильтрах ${toggle(true)}</span></div>
<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px">${["92", "98", "104", "110", "116", "122", "128"].map((v) => `<span style="height: 34px; min-width: 44px; padding: 0 10px; box-sizing: border-box; border-radius: 10px; background: ${C.haze}; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px">${v}</span>`).join("")}</div>
<div style="font-size: 12px; color: ${C.muted}; margin-top: 8px">Порядок значений — как на витрине. Перетаскивайте.</div></div>
<div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between; padding: 14px; border-radius: 18px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}"><div><div style="font-weight: 700; font-size: 15px">Размер обуви</div><div style="font-size: 13px; color: ${C.quiet}">24–31 · 8 значений</div></div><span style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${C.quiet}">в фильтрах ${toggle(true)}</span></div>
<div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between; padding: 14px; border-radius: 18px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}"><div><div style="font-weight: 700; font-size: 15px">Цвет</div><div style="font-size: 13px; color: ${C.quiet}">из Excel · 9 значений</div></div><span style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${C.quiet}">в фильтрах ${toggle(false)}</span></div>
</div>`]);

// 9. Как показывать наличие
const radio = (on, t, sub, preview) => `<div style="padding: 14px; border-radius: 20px; background: #ffffff; ${on ? `box-shadow: 0 0 0 2px ${C.ink}` : `box-shadow: 0 1px 0 ${C.line}`}"><div style="display: flex; gap: 12px"><span style="width: 22px; height: 22px; border-radius: 50%; flex: none; box-sizing: border-box; ${on ? `border: 7px solid ${C.ink}` : "border: 2px solid #C9C3E3"}"></span><div style="flex: 1"><div style="font-weight: 700; font-size: 15px">${t}</div><div style="font-size: 13px; color: ${C.quiet}; margin-top: 2px">${sub}</div><div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px">${preview}</div></div></div></div>`;
S.push(["Как показывать наличие", backBar("Наличие на витрине") + `<div style="padding: 16px 16px 0; font-size: 15px; line-height: 1.5; color: ${C.soft}">Что увидит покупатель, когда выберет размер.</div>
<div style="display: flex; flex-direction: column; gap: 10px; padding: 14px 16px 0">
${radio(true, "Есть / мало / нет", "Точное количество не видно", pill("В наличии", "#E6FBF2", C.inS) + pill("Осталось мало", "#FFF1D6", "#7A4300") + pill("Нет", "#F1EFFA", C.outS))}
${radio(false, "Точное количество", "Покупатель видит, сколько штук осталось", pill("В наличии: 6 шт.", "#E6FBF2", C.inS) + pill("Осталось 1 шт.", "#FFF1D6", "#7A4300"))}
</div>
<div style="margin: 16px 16px 0; padding: 14px; border-radius: 20px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}"><div style="display: flex; align-items: center; justify-content: space-between"><div><div style="font-weight: 700; font-size: 15px">«Мало» — это сколько?</div><div style="font-size: 13px; color: ${C.quiet}">столько штук и меньше</div></div>
<span style="display: flex; align-items: center; gap: 2px; border-radius: 999px; background: #F1EFFA; padding: 3px"><span style="width: 34px; height: 34px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700">−</span><span style="min-width: 28px; text-align: center; font-weight: 800; font-size: 17px">2</span><span style="width: 34px; height: 34px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700">+</span></span></div></div>
<div style="margin: 10px 16px 0; display: flex; align-items: center; justify-content: space-between; padding: 14px; border-radius: 20px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}"><div style="flex: 1; padding-right: 12px"><div style="font-weight: 700; font-size: 15px">Показывать закончившиеся</div><div style="font-size: 13px; color: ${C.quiet}">В конце списка, с пометкой «нет в наличии»</div></div>${toggle(false)}</div>`]);

// 10. Статистика
const stat = (n, l, sub, bg, fg) => `<div style="padding: 14px; border-radius: 20px; background: ${bg}"><div style="font-weight: 800; font-size: 28px; color: ${fg}; font-variant-numeric: tabular-nums">${n}</div><div style="font-size: 13px; font-weight: 600; color: ${fg}">${l}</div><div style="font-size: 12px; color: ${fg}; opacity: .8; margin-top: 2px">${sub}</div></div>`;
const bars = [38, 52, 44, 70, 61, 92, 80];
const topRow = (k, n, v, w) => `<div style="display: flex; align-items: center; gap: 10px; padding: 8px 0">${thumb(k, 40, 10)}<div style="flex: 1"><div style="font-weight: 600; font-size: 14px">${n}</div><div style="margin-top: 5px; height: 6px; border-radius: 999px; background: ${C.haze}"><div style="width: ${w}%; height: 100%; border-radius: 999px; background: ${C.violet}"></div></div></div><span style="font-weight: 700; font-size: 14px; font-variant-numeric: tabular-nums">${v}</span></div>`;
S.push(["Статистика", backBar("Статистика") + `<div style="display: flex; gap: 8px; padding: 14px 16px 0">${["7 дней", "30 дней", "Всё время"].map((t, i) => `<span style="height: 36px; padding: 0 14px; border-radius: 999px; display: inline-flex; align-items: center; font-weight: 600; font-size: 14px; background: ${i === 0 ? C.ink : C.haze}; color: ${i === 0 ? "#ffffff" : C.ink}">${t}</span>`).join("")}</div>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 14px 16px 0">${stat("1 240", "просмотров витрины", "+18% к прошлой неделе", "#ECE9FF", "#2A2290")}${stat("46", "нажали «Заказать»", "переходы в WhatsApp", "#E6FBF2", C.mintInk)}</div>
<div style="margin: 10px 16px 0; padding: 14px; border-radius: 20px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}"><div style="font-weight: 700; font-size: 15px">Просмотры по дням</div>
<div style="display: flex; align-items: flex-end; gap: 10px; height: 96px; margin-top: 12px">${bars.map((h, i) => `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px"><div style="width: 100%; height: ${h}px; border-radius: 8px 8px 4px 4px; background: ${i === 5 ? C.violet : C.lilac}"></div></div>`).join("")}</div>
<div style="display: flex; gap: 10px; margin-top: 6px; font-size: 11px; color: ${C.muted}">${["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => `<span style="flex: 1; text-align: center">${d}</span>`).join("")}</div></div>
<div style="margin: 10px 16px 0; padding: 8px 14px; border-radius: 20px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}"><div style="font-weight: 700; font-size: 15px; padding: 6px 0">Чаще смотрят</div>
${topRow("jacket", "Куртка демисезонная", 214, 100)}${topRow("dressY", "Платье летнее", 168, 78)}${topRow("sneakers", "Кроссовки на липучках", 121, 57)}</div>`]);

const COLW = 430, ROWH = 960;
const body = S.map(([t, b], i) => {
  const x = (i % 6) * COLW + 40, y = Math.floor(i / 6) * ROWH + 40;
  return `<div style="position: absolute; left: ${x}px; top: ${y}px"><div style="font-weight: 700; font-size: 17px; margin: 0 0 14px 4px">${i + 1}. ${t}</div><div style="position: relative; width: 390px; height: 844px; border-radius: 40px; overflow: hidden; background: ${C.paper}; box-shadow: 0 24px 60px rgba(40,20,110,.14)">${b}</div></div>`;
}).join("\n");
fs.writeFileSync(process.argv[2], page("Админка — телефон, остальные экраны", COLW * 6 + 40, ROWH * 2 + 40, body));
console.log("size", S.length, COLW * 6 + 40, ROWH * 2 + 40);
