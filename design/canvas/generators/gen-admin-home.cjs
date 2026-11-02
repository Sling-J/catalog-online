// Генерирует AdminHome.dc.html — главная до публикации (T-304), чего нет в AdminPhone (экран 1) и AdminAuthPhone (экран 10):
// компьютер — как утверждённый телефонный экран и новый магазин сразу после мастера; телефон — новый магазин.
// node gen-admin-home.cjs boards/AdminHome.dc.html
const fs = require("fs");
const { sv, P, C, btn, dot, page } = require("./admin-common.cjs");

// пункт чек-листа — как в AdminPhone, экран 1
const step = (done, title, sub, action = "", muted = false) => `<div style="display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 20px; background: #ffffff; box-shadow: 0 1px 0 ${C.line}">${done
  ? `<span style="width: 32px; height: 32px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center; background: ${C.mint}">${sv(P.check, C.mintInk, 18, 3)}</span>`
  : `<span style="width: 32px; height: 32px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center; border: 2px dashed #C9C3E3"></span>`}<div style="flex: 1"><div style="font-weight: 700; font-size: 15px; ${done || muted ? `color: ${C.quiet}` : ""}">${title}</div><div style="font-size: 13px; color: ${C.quiet}">${sub}</div></div>${action ? `<span style="font-weight: 700; font-size: 14px; color: ${C.violet}">${action}</span>` : ""}</div>`;
const progress = (done, total) => `<div style="margin-top: 12px; height: 10px; border-radius: 999px; background: ${C.haze}; overflow: hidden"><div style="width: ${Math.round((done / total) * 100)}%; height: 100%; border-radius: 999px; background: ${C.mint}"></div></div>`;
const address = `<div style="padding: 14px; border-radius: 20px; background: ${C.mist}"><div style="font-size: 13px; font-weight: 600; color: ${C.quiet}">Адрес витрины</div><div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px"><span style="font-weight: 700; font-size: 16px">aigerim-kids.[сервис].kz</span>${sv(P.copy, C.ink, 20)}</div></div>`;
const publish = (ready, note) => `${ready ? btn("Опубликовать витрину", "sun", "width: 100%") : btn("Опубликовать витрину", "soft", `width: 100%; color: ${C.muted}`)}<div style="text-align: center; margin-top: 10px; font-size: 13px; color: ${C.muted}">${note}</div>`;

// состояния главной
const ready = {
  done: 2, total: 4,
  steps: () => [
    step(true, "Магазин настроен", "Название, WhatsApp, адрес, график"),
    step(true, "Товары загружены", "214 товаров из Excel"),
    step(false, "Добавьте фото", "37 товаров без фото — их не видно", "Снять →"),
    step(false, "Опубликуйте витрину", "После этого ссылкой можно делиться"),
  ].join("\n"),
  publish: publish(true, "Можно и без фото — добавите потом"),
};
const fresh = {
  done: 0, total: 5,
  steps: () => [
    step(false, "Настройте магазин", "Адрес, график, как найти", "Заполнить →"),
    step(false, "Загрузите товары", "Из Excel или вручную", "Добавить →"),
    step(false, "Добавьте фото", "Когда появятся товары", "", true),
    step(false, "Подтвердите почту", "Письмо на aigerim.kids@mail.kz", "Ещё раз"),
    step(false, "Опубликуйте витрину", "После этого ссылкой можно делиться"),
  ].join("\n"),
  publish: publish(false, "Сначала добавьте товары"),
};

// ───── Телефон: шапка и меню — как в AdminPhone ─────
const top = `<div style="display: flex; align-items: center; gap: 10px; padding: 14px 16px 0">
<span style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; flex: none">АK</span>
<div style="flex: 1; min-width: 0"><div style="font-weight: 700; font-size: 15px">Айгерим Kids</div><div style="display: flex; align-items: center; gap: 5px; font-size: 12px; color: ${C.lowS}; font-weight: 600">${dot("#E8A100")}Черновик — витрина скрыта</div></div>
<span style="height: 36px; display: inline-flex; align-items: center; gap: 6px; padding: 0 12px; border-radius: 999px; background: ${C.haze}; font-weight: 600; font-size: 13px">${sv(P.ext, C.ink, 15)}Витрина</span>
</div>`;
const NAV = [["products", "Товары"], ["import", "Импорт"], ["shop", "Магазин"]];
const nav = `<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 84px; padding: 8px 10px 0; box-sizing: border-box; background: ${C.lilac}; border-radius: 26px 26px 0 0; display: flex; gap: 4px">
${NAV.map(([k, l]) => { const on = k === "shop"; return `<div style="position: relative; flex: 1; height: 56px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; ${on ? "background: #ffffff; box-shadow: 0 3px 0 rgba(90,70,190,.25)" : ""}; font-size: 12px; font-weight: ${on ? 700 : 600}; color: ${C.ink}">${sv(P[k], C.ink, 22, on ? 2.2 : 1.8)}${l}</div>`; }).join("")}
</div>`;
const phone = (state) => top + `<div style="padding: 22px 16px 0"><div style="font-weight: 800; font-size: 28px; letter-spacing: -0.03em; line-height: 1.1">Осталось немного до запуска</div><div style="font-size: 15px; color: ${C.soft}; margin-top: 6px">${state.done} из ${state.total} шагов готово</div>${progress(state.done, state.total)}</div>
<div style="display: flex; flex-direction: column; gap: 8px; padding: 18px 16px 0">${state.steps()}</div>
<div style="margin: 16px 16px 0">${address}</div>
<div style="position: absolute; left: 0; right: 0; bottom: 96px; padding: 0 16px">${state.publish}</div>` + nav;

// ───── Компьютер: колонка — как AdminSideDraft (черновик в две строки, A15) ─────
const NAVD = [["products", "Товары", "214"], ["import", "Импорт"], ["shop", "Магазин"]];
const side = (count) => `<div style="position: absolute; left: 0; top: 0; bottom: 0; width: 248px; padding: 22px 16px; box-sizing: border-box; background: ${C.lilac}; display: flex; flex-direction: column">
<div style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 20px; background: rgba(255,255,255,.55)"><span style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center">АK</span><div><div style="font-weight: 700; font-size: 15px">Айгерим Kids</div><div style="display: flex; align-items: flex-start; gap: 5px; font-size: 12px; font-weight: 600; color: ${C.lowS}"><span style="width: 8px; height: 8px; border-radius: 50%; background: #E8A100; flex: none; margin-top: 4px"></span><span>Черновик<br>Витрина скрыта</span></div></div></div>
<div style="display: flex; flex-direction: column; gap: 4px; margin-top: 22px">${NAVD.map(([k, l, n]) => { const on = k === "shop"; const num = k === "products" ? count : n; return `<div style="display: flex; align-items: center; gap: 12px; height: 48px; padding: 0 14px; border-radius: 16px; font-size: 15px; font-weight: ${on ? 700 : 600}; ${on ? "background: #ffffff; box-shadow: 0 3px 0 rgba(90,70,190,.25)" : ""}">${sv(P[k], C.ink, 20, on ? 2.2 : 1.8)}<span style="flex: 1">${l}</span>${num !== undefined ? `<span style="min-width: 22px; height: 22px; padding: 0 7px; box-sizing: border-box; border-radius: 999px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,.6)">${num}</span>` : ""}</div>`; }).join("")}</div>
<span style="flex: 1"></span>
<div style="padding: 14px; border-radius: 20px; background: rgba(255,255,255,.55); font-size: 13px"><div style="font-weight: 600; color: ${C.quiet}">Ваша витрина</div><div style="font-weight: 700; margin-top: 2px">aigerim-kids.[сервис].kz</div><div style="display: flex; gap: 6px; margin-top: 10px"><span style="flex: 1; height: 36px; border-radius: 12px; background: ${C.ink}; color: #ffffff; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px">${sv(P.ext, "#ffffff", 14)}Открыть</span><span style="width: 36px; height: 36px; border-radius: 12px; background: #ffffff; display: flex; align-items: center; justify-content: center">${sv(P.copy, C.ink, 16)}</span></div></div>
</div>`;
const desk = (state, count) => side(count) + `<div style="position: absolute; left: 248px; top: 0; right: 0; bottom: 0; background: ${C.paper}; padding: 28px 32px; box-sizing: border-box">
<div style="font-weight: 800; font-size: 30px; letter-spacing: -0.03em">Осталось немного до запуска</div>
<div style="display: flex; gap: 32px; margin-top: 6px; align-items: flex-start">
<div style="width: 560px"><div style="font-size: 15px; color: ${C.soft}">${state.done} из ${state.total} шагов готово</div>${progress(state.done, state.total)}
<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 22px">${state.steps()}</div></div>
<div style="width: 360px; margin-top: 50px">${address}<div style="margin-top: 16px">${state.publish}</div></div>
</div></div>`;

const PH = [["Главная — новый магазин сразу после мастера", phone(fresh)]];
const DK = [["Главная до публикации", desk(ready, "214")], ["Главная — новый магазин сразу после мастера", desk(fresh, "0")]];
const COLW = 430;
const phoneRow = PH.map(([t, b], i) => `<div style="position: absolute; left: ${i * COLW + 40}px; top: 40px"><div style="font-weight: 700; font-size: 17px; margin: 0 0 14px 4px">${i + 1}. ${t}</div><div style="position: relative; width: 390px; height: 844px; border-radius: 40px; overflow: hidden; background: ${C.paper}; box-shadow: 0 24px 60px rgba(40,20,110,.14)">${b}</div></div>`).join("\n");
const FW = 1440, FH = 900, GAP = 120, X0 = PH.length * COLW + 80;
const deskRow = DK.map(([t, b], i) => `<div style="position: absolute; left: ${X0 + i * (FW + GAP)}px; top: 40px"><div style="font-weight: 700; font-size: 22px; margin: 0 0 18px 4px">${PH.length + i + 1}. ${t}</div><div style="position: relative; width: ${FW}px; height: ${FH}px; border-radius: 24px; overflow: hidden; background: ${C.paper}; box-shadow: 0 24px 60px rgba(40,20,110,.12)">${b}</div></div>`).join("\n");
const W = X0 + DK.length * (FW + GAP), H = 40 + 50 + FH + 60;
fs.writeFileSync(process.argv[2], page("Админка — главная до публикации", W, H, phoneRow + "\n" + deskRow));
console.log("size", W, H);
