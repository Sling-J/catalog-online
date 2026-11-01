// Общие куски для макетов админки (телефон и компьютер)
const B = "/_blob/";
const IMG = {
  jacket: "1260977f2c0c34a5b933572bb6e99e94", jacket2: "4469123d08e33e3b8a0e21393b6e426b", coat: "4425d713fea616a795f8125f90d8aed0",
  raincoat: "a3bc2f157acffb785bd68c64b69fa957", denim: "8a58a9934844266efb16a8c4761e7f7b", hoodie: "b10ce1436e13380c548fa804ef4347fd",
  cardigan: "93fc374092f690eb46aa0b0cf74bcce4", tshirt: "167257d6a7f8ad684c2d856ae3a11150", sneakers: "04a201bc58d35022516d4467e49b7f41",
  dressY: "7cb5296df170d7a0aca0d4bd8ec7cb9e", dressR: "7d0f77b8370d9af612d61812d7452e5f", beanies: "ca2b511d14dcdf080d3e936049667bed",
  floral: "ed10ba6d31f748a438a21db8a7387c8a", beanie: "b7e066c9d74196dbd3a06f17035798be", pink: "2ec542edaef6635ace484ac3c7ad1f4a"
};
const img = (k) => B + IMG[k];
const sv = (d, c = "#17133D", s = 22, w = 2) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const P = {
  orders: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"></path><path d="M9 8h6M9 12h6"></path>',
  products: '<path d="M3 12V4h8l10 10-8 8z"></path><circle cx="7.5" cy="8.5" r="1.5"></circle>',
  import: '<path d="M12 15V4M8 8l4-4 4 4"></path><path d="M4 14v6h16v-6"></path>',
  shop: '<path d="M4 9l1.5-5h13L20 9"></path><path d="M4 9v11h16V9"></path><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"></path><path d="M10 20v-5h4v5"></path>',
  home: '<path d="M4 11l8-7 8 7v9H4z"></path>',
  back: '<path d="M15 6l-6 6 6 6"></path>',
  ext: '<path d="M14 4h6v6M20 4l-9 9"></path><path d="M18 14v6H4V6h6"></path>',
  search: '<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path>',
  plus: '<path d="M12 5v14M5 12h14"></path>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"></path>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"></path><circle cx="12" cy="13" r="3.5"></circle>',
  img: '<rect x="4" y="4" width="16" height="16" rx="3"></rect><circle cx="9" cy="9" r="1.6"></circle><path d="M20 16l-5-5-9 9"></path>',
  sync: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"></path><path d="M20 4v5h-5"></path><path d="M20 12a8 8 0 0 1-14 5.3L4 15"></path><path d="M4 20v-5h5"></path>',
  chev: '<path d="M9 6l6 6-6 6"></path>',
  down: '<path d="M7 10l5 5 5-5"></path>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M16 8V4H4v12h4"></path>',
  wa: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"></path><path d="M9.5 9.5c.3 1.8 1.7 3.6 4 4.6l1.2-1.2 1.8.8-.4 1.6c-3.4.2-7.4-3.4-7.6-7l1.6-.4.8 1.8z"></path>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>',
  file: '<path d="M6 3h8l4 4v14H6z"></path><path d="M14 3v4h4"></path><path d="M9 13h6M9 17h6"></path>',
  warn: '<path d="M12 4l9 16H3z"></path><path d="M12 10v4M12 17.5v.01"></path>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle>',
  drag: '<circle cx="9" cy="6" r="1"></circle><circle cx="15" cy="6" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="9" cy="18" r="1"></circle><circle cx="15" cy="18" r="1"></circle>',
  x: '<path d="M6 6l12 12M18 6L6 18"></path>'
};
const C = {
  ink: "#17133D", soft: "#3A3672", quiet: "#4A4580", muted: "#6B6694", paper: "#FBFAFF", haze: "#EEECF8", line: "#ECEAF5",
  lilac: "#C9BBFF", mist: "#E4DCFF", violet: "#3B2FD9", sun: "#FFD23F", sunU: "#C79A00", mint: "#5EE6B0", mintU: "#26B985", mintInk: "#0B3A28",
  inS: "#157A52", lowS: "#A35A00", outS: "#7A7598", coral: "#D9532F"
};
const pill = (t, bg, fg, extra = "") => `<span style="display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; background: ${bg}; color: ${fg}; font-weight: 700; font-size: 12px; white-space: nowrap; ${extra}">${t}</span>`;
const dot = (c) => `<span style="width: 8px; height: 8px; border-radius: 50%; background: ${c}; flex: none"></span>`;
const btn = (t, kind = "dark", extra = "") => {
  const k = {
    dark: `background: ${C.ink}; color: #ffffff; box-shadow: 0 4px 0 #0B0A26`,
    sun: `background: ${C.sun}; color: ${C.ink}; box-shadow: 0 4px 0 ${C.sunU}`,
    mint: `background: ${C.mint}; color: ${C.mintInk}; box-shadow: 0 4px 0 ${C.mintU}`,
    soft: `background: ${C.haze}; color: ${C.ink}`,
    line: `background: #ffffff; color: ${C.ink}; border: 1.5px solid #DAD6EC`
  }[kind];
  return `<span style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 52px; padding: 0 22px; box-sizing: border-box; border-radius: 999px; font-weight: 700; font-size: 15px; ${k}; ${extra}">${t}</span>`;
};
const field = (label, value, note = "", extra = "") => `<div style="${extra}"><div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: ${C.quiet}; margin-bottom: 6px"><span>${label}</span>${note}</div><div style="min-height: 48px; padding: 13px 14px; box-sizing: border-box; border-radius: 16px; background: #ffffff; border: 1.5px solid #E2DFF0; font-size: 15px; line-height: 1.4">${value}</div></div>`;
const syncNote = `<span style="display: inline-flex; align-items: center; gap: 4px; color: ${C.violet}; font-weight: 600">${sv(P.sync, C.violet, 13, 2.2)}из Excel</span>`;
const toggle = (on) => `<span style="width: 46px; height: 28px; border-radius: 999px; position: relative; display: inline-block; flex: none; background: ${on ? C.inS : "#DCD8EE"}"><span style="position: absolute; top: 3px; left: ${on ? "21px" : "3px"}; width: 22px; height: 22px; border-radius: 50%; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,.15)"></span></span>`;
const thumb = (k, s = 44, r = 12, extra = "") => `<img src="${img(k)}" alt="" style="width: ${s}px; height: ${s}px; border-radius: ${r}px; object-fit: cover; flex: none; background: ${C.haze}; ${extra}">`;
const noPhoto = (s = 56, r = 14) => `<span style="width: ${s}px; height: ${s}px; border-radius: ${r}px; flex: none; border: 1.5px dashed #C9C3E3; background: #F6F5FB; display: flex; align-items: center; justify-content: center">${sv(P.cam, "#8C86B0", Math.round(s / 2.6))}</span>`;

const STYLE = `body{margin:0;background:#F1F0F7}`;
function page(title, W, H, body) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Geologica:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet">
<style>${STYLE}</style>
</helmet>
<div style="width: ${W}px; height: ${H}px; position: relative; overflow: hidden; font-family: 'Geologica', system-ui, sans-serif; color: ${C.ink}; background: #F1F0F7">
${body}
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
}
module.exports = { B, IMG, img, sv, P, C, pill, dot, btn, field, syncNote, toggle, thumb, noPhoto, page };
