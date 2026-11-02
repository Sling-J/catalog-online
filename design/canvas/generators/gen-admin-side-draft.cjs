// Генерирует AdminSideDraft.dc.html — колонка меню на компьютере: магазин опубликован и в черновике.
// node gen-admin-side-draft.cjs boards/AdminSideDraft.dc.html
// Колонка — как side() в gen-admin-desk*.cjs. Черновик (решение основателя 2026-11-02): «Черновик», с новой строки
// «Витрина скрыта»; точка — у первой строки.
const fs = require("fs");
const { sv, P, C, dot, page } = require("./admin-common.cjs");

const NAV = [["products", "Товары", "214"], ["import", "Импорт"], ["shop", "Магазин"]];
const status = (draft) => draft
  ? `<div style="display: flex; align-items: flex-start; gap: 5px; font-size: 12px; font-weight: 600; color: ${C.lowS}"><span style="width: 8px; height: 8px; border-radius: 50%; background: #E8A100; flex: none; margin-top: 4px"></span><span>Черновик<br>Витрина скрыта</span></div>`
  : `<div style="display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: ${C.inS}">${dot(C.inS)}Опубликован</div>`;
const side = (draft) => `<div style="position: absolute; left: 0; top: 0; bottom: 0; width: 248px; padding: 22px 16px; box-sizing: border-box; background: ${C.lilac}; display: flex; flex-direction: column">
<div style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 20px; background: rgba(255,255,255,.55)"><span style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(140deg, #FF9CC8, #7C6CFF); color: #ffffff; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center">АK</span><div><div style="font-weight: 700; font-size: 15px">Айгерим Kids</div>${status(draft)}</div></div>
<div style="display: flex; flex-direction: column; gap: 4px; margin-top: 22px">${NAV.map(([k, l, n]) => { const on = k === "products"; return `<div style="display: flex; align-items: center; gap: 12px; height: 48px; padding: 0 14px; border-radius: 16px; font-size: 15px; font-weight: ${on ? 700 : 600}; ${on ? "background: #ffffff; box-shadow: 0 3px 0 rgba(90,70,190,.25)" : ""}">${sv(P[k], C.ink, 20, on ? 2.2 : 1.8)}<span style="flex: 1">${l}</span>${n ? `<span style="min-width: 22px; height: 22px; padding: 0 7px; box-sizing: border-box; border-radius: 999px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,.6)">${n}</span>` : ""}</div>`; }).join("")}</div>
<span style="flex: 1"></span>
<div style="padding: 14px; border-radius: 20px; background: rgba(255,255,255,.55); font-size: 13px"><div style="font-weight: 600; color: ${C.quiet}">Ваша витрина</div><div style="font-weight: 700; margin-top: 2px">aigerim-kids.[сервис].kz</div><div style="display: flex; gap: 6px; margin-top: 10px"><span style="flex: 1; height: 36px; border-radius: 12px; background: ${C.ink}; color: #ffffff; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px">${sv(P.ext, "#ffffff", 14)}Открыть</span><span style="width: 36px; height: 36px; border-radius: 12px; background: #ffffff; display: flex; align-items: center; justify-content: center">${sv(P.copy, C.ink, 16)}</span></div></div>
</div>`;

const S = [["Опубликован", side(false)], ["Черновик", side(true)]];
const W = 248, H = 900, GAP = 80;
const body = S.map(([t, b], i) => `<div style="position: absolute; left: ${i * (W + GAP) + 40}px; top: 40px"><div style="font-weight: 700; font-size: 17px; margin: 0 0 14px 4px">${i + 1}. ${t}</div><div style="position: relative; width: ${W}px; height: ${H}px; border-radius: 24px; overflow: hidden; background: ${C.paper}; box-shadow: 0 24px 60px rgba(40,20,110,.12)">${b}</div></div>`).join("\n");
const FW = S.length * (W + GAP) + 40, FH = H + 40 + 50;
fs.writeFileSync(process.argv[2], page("Админка — колонка меню: черновик", FW, FH, body));
console.log("size", FW, FH);
