// Генерирует экраны входа, почты и пароля (T-302): телефон 390×844 и компьютер 1440×900.
// node gen-admin-auth.cjs boards/AdminAuthPhone.dc.html boards/AdminAuthDesk.dc.html
// Устроены как утверждённая регистрация (AdminPhone2 / AdminDesk2, экран 1); ошибки полей — по DESIGN.md
// (рамка coral-underside и подпись под полем).
const fs = require("fs");
const { sv, P, C, pill, dot, btn, field, page } = require("./admin-common.cjs");

const MAIL = '<rect x="3" y="5" width="18" height="14" rx="3"></rect><path d="M4 7l8 6 8-6"></path>';
const BRAND = "catalog·online";

// поле с ошибкой: рамка coral-underside, подпись под полем
const errField = (label, value, error, note = "", extra = "") => field(label, value, note, extra)
  .replace("border: 1.5px solid #E2DFF0", `border: 1.5px solid ${C.coral}`)
  .replace(/<\/div><\/div>$/, `</div><div style="margin-top: 6px; font-size: 13px; color: ${C.coral}">${error}</div></div>`);
const link = (t) => `<b style="color: ${C.violet}">${t}</b>`;
const forgot = `<span style="color: ${C.violet}">Забыли пароль?</span>`;
const strong = `<span style="color: ${C.inS}">надёжный</span>`;
// значок состояния: письмо, готово, ссылка устарела
const badge = (kind, s = 64) => {
  const [bg, icon] = { mail: [C.mist, sv(MAIL, C.ink, 30, 2)], ok: [C.mint, sv(P.check, C.mintInk, 32, 2.6)], warn: ["#FFE9E1", sv(P.warn, C.coral, 30, 2.2)] }[kind];
  return `<span style="width: ${s}px; height: ${s}px; border-radius: 20px; background: ${bg}; display: flex; align-items: center; justify-content: center">${icon}</span>`;
};

// ───────────── Телефон ─────────────
const pBrand = `<div style="display: flex; align-items: center; gap: 10px"><span style="width: 40px; height: 40px; border-radius: 14px; background: ${C.lilac}; display: flex; align-items: center; justify-content: center">${sv(P.shop, C.ink, 22)}</span><span style="font-weight: 800; font-size: 18px">${BRAND}</span></div>`;
const pForm = (title, sub, body) => `<div style="padding: 40px 24px 0">${pBrand}
<div style="font-weight: 800; font-size: 32px; letter-spacing: -0.03em; line-height: 1.1; margin-top: 40px">${title}</div>
<div style="font-size: 16px; line-height: 1.5; color: ${C.soft}; margin-top: 10px">${sub}</div>
${body}</div>`;
const pFields = (...f) => `<div style="display: flex; flex-direction: column; gap: 14px; margin-top: 30px">${f.join("\n")}</div>`;
const pCta = (t, kind = "sun") => `<div style="margin-top: 24px">${btn(t, kind, "width: 100%")}</div>`;
const pFoot = (inner) => `<div style="margin-top: 40px; text-align: center; font-size: 15px">${inner}</div>`;
const pNote = (t) => `<div style="margin-top: 14px; font-size: 13px; line-height: 1.5; color: ${C.muted}; text-align: center">${t}</div>`;
const pState = (kind, title, sub, body) => `<div style="padding: 40px 24px 0">${pBrand}
<div style="margin-top: 72px">${badge(kind)}</div>
<div style="font-weight: 800; font-size: 32px; letter-spacing: -0.03em; line-height: 1.1; margin-top: 24px">${title}</div>
<div style="font-size: 16px; line-height: 1.5; color: ${C.soft}; margin-top: 10px">${sub}</div>
${body}</div>`;

const top = `<div style="display: flex; align-items: center; gap: 10px; padding: 14px 16px 0">
<span style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; flex: none">АK</span>
<div style="flex: 1; min-width: 0"><div style="font-weight: 700; font-size: 15px">Айгерим Kids</div><div style="display: flex; align-items: center; gap: 5px; font-size: 12px; color: ${C.lowS}; font-weight: 600">${dot("#E8A100")}Черновик — витрина скрыта</div></div>
<span style="height: 36px; display: inline-flex; align-items: center; gap: 6px; padding: 0 12px; border-radius: 999px; background: ${C.haze}; font-weight: 600; font-size: 13px">${sv(P.ext, C.ink, 15)}Витрина</span>
</div>`;
const NAV = [["products", "Товары"], ["import", "Импорт"], ["shop", "Магазин"]];
const nav = (active) => `<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 84px; padding: 8px 10px 0; box-sizing: border-box; background: ${C.lilac}; border-radius: 26px 26px 0 0; display: flex; gap: 4px">
${NAV.map(([k, l]) => { const on = k === active; return `<div style="position: relative; flex: 1; height: 56px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; ${on ? "background: #ffffff; box-shadow: 0 3px 0 rgba(90,70,190,.25)" : ""}; font-size: 12px; font-weight: ${on ? 700 : 600}; color: ${C.ink}">${sv(P[k], C.ink, 22, on ? 2.2 : 1.8)}${l}</div>`; }).join("")}
</div>`;
const backBar = (t) => `<div style="display: flex; align-items: center; gap: 10px; padding: 14px 16px 0"><span style="width: 44px; height: 44px; border-radius: 50%; background: ${C.haze}; display: flex; align-items: center; justify-content: center; flex: none">${sv(P.back, C.ink, 20, 2.4)}</span><div style="flex: 1; font-weight: 800; font-size: 20px">${t}</div></div>`;
const bottom = (inner) => `<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 16px 24px; background: linear-gradient(rgba(251,250,255,0), ${C.paper} 30%)">${inner}</div>`;

// пункт чек-листа главной (как в AdminPhone, экран 1)
const step = (done, title, sub, action = "") => `<div style="display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 20px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}">${done
  ? `<span style="width: 32px; height: 32px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center; background: ${C.mint}">${sv(P.check, C.mintInk, 18, 2.8)}</span>`
  : `<span style="width: 32px; height: 32px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center; border: 2px dashed #C9C3E3"></span>`}<div style="flex: 1"><div style="font-weight: 700; font-size: 15px; ${done ? `color: ${C.quiet}` : ""}">${title}</div><div style="font-size: 13px; color: ${C.quiet}">${sub}</div></div>${action}</div>`;

const PH = [];
PH.push(["Вход", pForm("Вход в каталог", "Почта и пароль, которые вы указали при регистрации.",
  pFields(field("Email", "aigerim.kids@mail.kz"), field("Пароль", "••••••••••", forgot)) + pCta("Войти") + pFoot(`Ещё нет каталога? ${link("Создать")}`))]);
PH.push(["Вход — неверная почта или пароль", pForm("Вход в каталог", "Почта и пароль, которые вы указали при регистрации.",
  pFields(field("Email", "aigerim.kids@mail.kz"), errField("Пароль", "••••••••", "Неверная почта или пароль", forgot)) + pCta("Войти") + pFoot(`Ещё нет каталога? ${link("Создать")}`))]);
PH.push(["Регистрация — ошибки", pForm("Создайте каталог магазина", "Бесплатно на время пилота. Понадобятся почта и номер WhatsApp.",
  pFields(errField("Email", "aigerim.kids@mail.kz", `Каталог с этой почтой уже есть. ${link("Войти")}`), errField("Пароль", "••••••", "Минимум 8 символов", `<span style="color: ${C.coral}">короткий</span>`))
  + pCta("Создать каталог") + pNote("Пришлём письмо для подтверждения почты") + pFoot(`Уже есть каталог? ${link("Войти")}`))]);
PH.push(["Забыли пароль", pForm("Восстановление пароля", "Пришлём на почту ссылку, по которой можно задать новый пароль.",
  pFields(field("Email", "aigerim.kids@mail.kz")) + pCta("Прислать ссылку") + pFoot(`Вспомнили? ${link("Войти")}`))]);
PH.push(["Письмо отправлено", pState("mail", "Проверьте почту", "Если каталог с почтой <b>aigerim.kids@mail.kz</b> есть, мы прислали ссылку для нового пароля. Письмо может попасть в «Спам».",
  pCta("Отправить ещё раз", "soft") + pNote("Повторно — через 45 секунд") + pFoot(link("Вернуться ко входу")))]);
PH.push(["Новый пароль (по ссылке из письма)", pForm("Новый пароль", "Не короче 8 символов. После сохранения выйдем на всех устройствах — войдите с новым паролем.",
  pFields(field("Новый пароль", "••••••••••", strong)) + pCta("Сохранить пароль"))]);
PH.push(["Ссылка для пароля устарела", pState("warn", "Ссылка устарела", "Ссылки из писем работают ограниченное время и только один раз. Запросите новую — придёт через минуту.",
  pCta("Прислать новую ссылку") + pFoot(link("Вернуться ко входу")))]);
PH.push(["Почта подтверждена (по ссылке из письма)", pState("ok", "Почта подтверждена", "Спасибо! Теперь витрину можно опубликовать.",
  pCta("Перейти в каталог", "dark"))]);
PH.push(["Ссылка подтверждения устарела", pState("warn", "Ссылка устарела", "Ссылки из писем работают ограниченное время и только один раз. Отправим новое письмо на <b>aigerim.kids@mail.kz</b>.",
  pCta("Отправить письмо ещё раз") + pFoot(link("Перейти в каталог")))]);
PH.push(["Главная — почта не подтверждена", top + `<div style="padding: 22px 16px 0"><div style="font-weight: 800; font-size: 28px; letter-spacing: -0.03em; line-height: 1.1">Осталось немного до запуска</div><div style="font-size: 15px; color: ${C.soft}; margin-top: 6px">2 из 5 шагов готово</div>
<div style="margin-top: 12px; height: 10px; border-radius: 999px; background: ${C.haze}; overflow: hidden"><div style="width: 40%; height: 100%; border-radius: 999px; background: ${C.mint}"></div></div></div>
<div style="display: flex; flex-direction: column; gap: 8px; padding: 18px 16px 0">
${step(true, "Магазин настроен", "Название, WhatsApp, адрес, график")}
${step(true, "Товары загружены", "214 товаров из Excel")}
${step(false, "Добавьте фото", "37 товаров без фото — их не видно", `<span style="font-weight: 700; font-size: 14px; color: ${C.violet}">Снять →</span>`)}
${step(false, "Подтвердите почту", "Письмо на aigerim.kids@mail.kz", `<span style="font-weight: 700; font-size: 14px; color: ${C.violet}">Ещё раз</span>`)}
${step(false, "Опубликуйте витрину", "После этого ссылкой можно делиться")}
</div>
<div style="position: absolute; left: 0; right: 0; bottom: 96px; padding: 0 16px">${btn("Опубликовать витрину", "soft", `width: 100%; color: ${C.muted}`)}<div style="text-align: center; margin-top: 10px; font-size: 13px; color: ${C.muted}">Сначала подтвердите почту</div></div>` + nav("shop")]);
// «Вход и пароль»: почта подтверждена / нет (тогда «Отправить ещё раз»), пароль сохранён — поля очищены
const accCard = (verified) => `<div style="font-size: 13px; font-weight: 600; color: ${C.quiet}">Почта для входа</div><div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 4px"><span style="font-weight: 700; font-size: 16px">aigerim.kids@mail.kz</span>${verified ? pill(dot(C.inS) + "подтверждена", "#E6FBF2", C.mintInk) : pill(dot("#E8A100") + "не подтверждена", "#FFF1D6", "#7A4300")}</div>${verified ? "" : `<div style="margin-top: 8px; font-size: 13px; line-height: 1.5; color: ${C.quiet}">Письмо со ссылкой отправлено на эту почту. ${link("Отправить ещё раз")}</div>`}`;
const accHint = (saved) => saved
  ? `<div style="margin-top: 10px; font-size: 13px; line-height: 1.5; color: ${C.muted}"><span style="color: ${C.inS}; font-weight: 600">Пароль сохранён.</span> На остальных устройствах вышли.</div>`
  : `<div style="margin-top: 10px; font-size: 13px; line-height: 1.5; color: ${C.muted}">На этом устройстве вы останетесь, на остальных — выйдем.</div>`;
const accFields = (saved) => saved ? `${field("Текущий пароль", "&nbsp;", forgot)}${field("Новый пароль", "&nbsp;")}` : `${field("Текущий пароль", "••••••••••", forgot)}${field("Новый пароль", "••••••••••••", strong)}`;
const phoneAccount = (verified, saved) => backBar("Вход и пароль") + `<div style="padding: 16px 16px 0">
<div style="padding: 14px; border-radius: 20px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}">${accCard(verified)}</div>
<div style="font-weight: 700; font-size: 15px; margin-top: 22px">Сменить пароль</div>
<div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px">${accFields(saved)}</div>
${accHint(saved)}
</div>` + bottom(btn("Сохранить пароль", "dark", "width: 100%"));
PH.push(["Вход и пароль (раздел «Магазин»)", phoneAccount(true, false)]);
PH.push(["Вход и пароль — почта не подтверждена, пароль сохранён", phoneAccount(false, true)]);

// ───────────── Компьютер ─────────────
const dBrand = pBrand;
const pitch = `<div style="flex: 1; position: relative; background: ${C.lilac}; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden">
<div aria-hidden="true" style="position: absolute; left: -80px; top: -60px; width: 360px; height: 360px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.7), rgba(255,255,255,0) 68%)"></div><div style="position: relative; width: 460px">
<div style="font-weight: 800; font-size: 30px; letter-spacing: -0.03em; line-height: 1.15">Покупатели видят размеры и наличие сами — и пишут вам уже с готовым заказом</div>
<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 28px">${[["1", "Загрузите товары из Excel или добавьте вручную"], ["2", "Сфотографируйте товары с телефона"], ["3", "Поделитесь ссылкой в Instagram и WhatsApp"]].map(([n, t]) => `<div style="display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 20px; background: rgba(255,255,255,.6)"><span style="width: 36px; height: 36px; border-radius: 50%; flex: none; background: ${C.sun}; box-shadow: 0 3px 0 ${C.sunU}; display: flex; align-items: center; justify-content: center; font-weight: 800">${n}</span><span style="font-weight: 600; font-size: 16px">${t}</span></div>`).join("")}</div></div></div>`;
const split = (left) => `<div style="position: absolute; inset: 0; display: flex">
<div style="width: 640px; padding: 48px 64px; box-sizing: border-box; background: #ffffff">${dBrand}${left}</div>${pitch}</div>`;
const dTitle = (t, sub, mt = 90) => `<div style="font-weight: 800; font-size: 42px; letter-spacing: -0.035em; line-height: 1.08; margin-top: ${mt}px">${t}</div>
<div style="font-size: 17px; line-height: 1.55; color: ${C.soft}; margin-top: 12px">${sub}</div>`;
const dFields = (...f) => `<div style="display: flex; flex-direction: column; gap: 16px; margin-top: 34px">${f.join("")}</div>`;
const dCta = (t, kind = "sun") => `<div style="margin-top: 26px">${btn(t, kind, "width: 100%")}</div>`;
const dNote = (t) => `<div style="margin-top: 14px; font-size: 14px; color: ${C.muted}; text-align: center">${t}</div>`;
const dFoot = (inner) => `<div style="margin-top: 40px; text-align: center; font-size: 15px">${inner}</div>`;
const dState = (kind, t, sub) => `<div style="margin-top: 90px">${badge(kind, 72)}</div>${dTitle(t, sub, 26)}`;

const NAVD = [["products", "Товары", "214"], ["import", "Импорт"], ["shop", "Магазин"]];
const side = (active) => `<div style="position: absolute; left: 0; top: 0; bottom: 0; width: 248px; padding: 22px 16px; box-sizing: border-box; background: ${C.lilac}; display: flex; flex-direction: column">
<div style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 20px; background: rgba(255,255,255,.55)"><span style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center">АK</span><div><div style="font-weight: 700; font-size: 15px">Айгерим Kids</div><div style="display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: ${C.inS}">${dot(C.inS)}Опубликован</div></div></div>
<div style="display: flex; flex-direction: column; gap: 4px; margin-top: 22px">${NAVD.map(([k, l, n]) => { const on = k === active; return `<div style="display: flex; align-items: center; gap: 12px; height: 48px; padding: 0 14px; border-radius: 16px; font-size: 15px; font-weight: ${on ? 700 : 600}; ${on ? "background: #ffffff; box-shadow: 0 3px 0 rgba(90,70,190,.25)" : ""}">${sv(P[k], C.ink, 20, on ? 2.2 : 1.8)}<span style="flex: 1">${l}</span>${n ? `<span style="min-width: 22px; height: 22px; padding: 0 7px; box-sizing: border-box; border-radius: 999px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,.6)">${n}</span>` : ""}</div>`; }).join("")}</div>
<span style="flex: 1"></span>
<div style="padding: 14px; border-radius: 20px; background: rgba(255,255,255,.55); font-size: 13px"><div style="font-weight: 600; color: ${C.quiet}">Ваша витрина</div><div style="font-weight: 700; margin-top: 2px">aigerim-kids.[сервис].kz</div><div style="display: flex; gap: 6px; margin-top: 10px"><span style="flex: 1; height: 36px; border-radius: 12px; background: ${C.ink}; color: #ffffff; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px">${sv(P.ext, "#ffffff", 14)}Открыть</span><span style="width: 36px; height: 36px; border-radius: 12px; background: #ffffff; display: flex; align-items: center; justify-content: center">${sv(P.copy, C.ink, 16)}</span></div></div>
</div>`;
const main = (inner) => `<div style="position: absolute; left: 248px; top: 0; right: 0; bottom: 0; background: ${C.paper}">${inner}</div>`;
const h1 = (t, right = "") => `<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px"><div style="font-weight: 800; font-size: 30px; letter-spacing: -0.03em">${t}</div><div style="display: flex; gap: 10px; align-items: center">${right}</div></div>`;

const DK = [];
DK.push(["Вход", split(dTitle("Вход в каталог", "Почта и пароль, которые вы указали при регистрации.") + dFields(field("Email", "aigerim.kids@mail.kz"), field("Пароль", "••••••••••", forgot)) + dCta("Войти") + dFoot(`Ещё нет каталога? ${link("Создать")}`))]);
DK.push(["Вход — неверная почта или пароль", split(dTitle("Вход в каталог", "Почта и пароль, которые вы указали при регистрации.") + dFields(field("Email", "aigerim.kids@mail.kz"), errField("Пароль", "••••••••", "Неверная почта или пароль", forgot)) + dCta("Войти") + dFoot(`Ещё нет каталога? ${link("Создать")}`))]);
DK.push(["Забыли пароль", split(dTitle("Восстановление пароля", "Пришлём на почту ссылку, по которой можно задать новый пароль.") + dFields(field("Email", "aigerim.kids@mail.kz")) + dCta("Прислать ссылку") + dFoot(`Вспомнили? ${link("Войти")}`))]);
DK.push(["Письмо отправлено", split(dState("mail", "Проверьте почту", "Если каталог с почтой <b>aigerim.kids@mail.kz</b> есть, мы прислали ссылку для нового пароля. Письмо может попасть в «Спам».") + dCta("Отправить ещё раз", "soft") + dNote("Повторно — через 45 секунд") + dFoot(link("Вернуться ко входу")))]);
DK.push(["Новый пароль (по ссылке из письма)", split(dTitle("Новый пароль", "Не короче 8 символов. После сохранения выйдем на всех устройствах — войдите с новым паролем.") + dFields(field("Новый пароль", "••••••••••", strong)) + dCta("Сохранить пароль"))]);
DK.push(["Почта подтверждена (по ссылке из письма)", split(dState("ok", "Почта подтверждена", "Спасибо! Теперь витрину можно опубликовать.") + dCta("Перейти в каталог", "dark"))]);
DK.push(["Ссылка для пароля устарела", split(dState("warn", "Ссылка устарела", "Ссылки из писем работают ограниченное время и только один раз. Запросите новую — придёт через минуту.") + dCta("Прислать новую ссылку") + dFoot(link("Вернуться ко входу")))]);
DK.push(["Ссылка подтверждения устарела", split(dState("warn", "Ссылка устарела", "Ссылки из писем работают ограниченное время и только один раз. Отправим новое письмо на <b>aigerim.kids@mail.kz</b>.") + dCta("Отправить письмо ещё раз") + dFoot(link("Перейти в каталог")))]);
const deskAccount = (verified, saved) => side("shop") + main(`<div style="position: absolute; inset: 0; padding: 24px 32px; box-sizing: border-box">
<div style="font-size: 14px; color: ${C.quiet}">Магазин / Вход и пароль</div>
<div style="margin-top: 6px">${h1("Вход и пароль", btn("Сохранить пароль", "dark", "height: 44px; font-size: 14px"))}</div>
<div style="width: 560px; margin-top: 18px">
<div style="padding: 16px 18px; border-radius: 22px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}, 0 6px 16px rgba(40,30,110,.05)">${accCard(verified)}</div>
<div style="font-weight: 700; font-size: 15px; margin-top: 26px">Сменить пароль</div>
<div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px">${accFields(saved)}</div>
${accHint(saved)}
</div></div>`);
DK.push(["Вход и пароль (раздел «Магазин»)", deskAccount(true, false)]);
DK.push(["Вход и пароль — почта не подтверждена, пароль сохранён", deskAccount(false, true)]);

// ───────────── Раскладка ─────────────
const COLW = 430, ROWH = 960, PER = 6;
const phoneBody = PH.map(([t, b], i) => {
  const x = (i % PER) * COLW + 40, y = Math.floor(i / PER) * ROWH + 40;
  return `<div style="position: absolute; left: ${x}px; top: ${y}px"><div style="font-weight: 700; font-size: 17px; margin: 0 0 14px 4px">${i + 1}. ${t}</div><div style="position: relative; width: 390px; height: 844px; border-radius: 40px; overflow: hidden; background: ${C.paper}; box-shadow: 0 24px 60px rgba(40,20,110,.14)">${b}</div></div>`;
}).join("\n");
const PW = COLW * PER + 40, PHH = ROWH * Math.ceil(PH.length / PER) + 40;
fs.writeFileSync(process.argv[2], page("Админка — вход, почта и пароль, телефон", PW, PHH, phoneBody));

const FW = 1440, FH = 900, GAP = 120, LAB = 50, DPER = 5;
const deskBody = DK.map(([t, b], i) => {
  const x = (i % DPER) * (FW + GAP) + 60, y = Math.floor(i / DPER) * (FH + LAB + GAP + 18) + 60;
  return `<div style="position: absolute; left: ${x}px; top: ${y}px"><div style="font-weight: 700; font-size: 22px; margin: 0 0 18px 4px">${i + 1}. ${t}</div><div style="position: relative; width: ${FW}px; height: ${FH}px; border-radius: 24px; overflow: hidden; background: ${C.paper}; box-shadow: 0 24px 60px rgba(40,20,110,.12)">${b}</div></div>`;
}).join("\n");
const rows = Math.ceil(DK.length / DPER);
const DW = DPER * (FW + GAP), DH = rows * (FH + LAB + 18) + (rows - 1) * GAP + 2 * 60;
fs.writeFileSync(process.argv[3], page("Админка — вход, почта и пароль, компьютер", DW, DH, deskBody));
console.log("phone", PH.length, PW, PHH, "desk", DK.length, DW, DH);
