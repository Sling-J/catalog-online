import type { Box, Diff, Item, Report, Rgba } from './types.ts';

export type CompareOptions = {
  /** Допуск по положению и размеру, px: доли пикселя от разных метрик шрифта не считаем. */
  tolerance: number;
  /**
   * Дальше этого, px, одинаковый текст — уже не тот же элемент, а другие данные (в моках другие товары
   * и числа, строки идут в другом порядке).
   */
  maxShift: number;
};

const round = (value: number) => Math.round(value * 10) / 10;
const sign = (value: number) => (value > 0 ? `+${round(value)}` : `${round(value)}`);
const hex = ([r, g, b, a]: Rgba) =>
  `#${[r, g, b].map((part) => part.toString(16).padStart(2, '0')).join('')}${a < 255 ? ` / ${round(a / 255)}` : ''}`;
// полупрозрачные цвета после пересчёта могут разойтись на единицу
const sameColor = (a: Rgba, b: Rgba) => a.every((part, index) => Math.abs(part - b[index]!) <= 2);

/** Расхождения одной пары «макет → приложение»: положение, размер, шрифт, цвет и подложка текста. */
export function diffPair(design: Item, app: Item, { tolerance }: CompareOptions): string[] {
  const problems: string[] = [];
  const geometry = (label: string, d: number, a: number) => {
    if (Math.abs(a - d) > tolerance) problems.push(`${label} ${round(d)}→${round(a)} (${sign(a - d)})`);
  };
  geometry('x', design.x, app.x);
  geometry('y', design.y, app.y);
  if (!design.input && !app.input) geometry('ширина', design.w, app.w);
  geometry('высота', design.h, app.h);
  if (design.fontSize !== app.fontSize) problems.push(`шрифт ${design.fontSize}→${app.fontSize}px`);
  if (design.fontWeight !== app.fontWeight) problems.push(`насыщенность ${design.fontWeight}→${app.fontWeight}`);
  if (Math.abs(design.letterSpacing - app.letterSpacing) > 0.05) {
    problems.push(`межбуквенный ${round(design.letterSpacing)}→${round(app.letterSpacing)}px`);
  }
  if (!sameColor(design.color, app.color)) problems.push(`цвет ${hex(design.color)}→${hex(app.color)}`);
  problems.push(...diffBox(design.box, app.box, tolerance));
  return problems;
}

function diffBox(design: Box | null, app: Box | null, tolerance: number): string[] {
  if (!design && !app) return [];
  if (!design) return ['подложка есть только в приложении'];
  if (!app) return ['подложка есть только в макете'];
  const problems: string[] = [];
  const geometry = (label: string, d: number, a: number) => {
    if (Math.abs(a - d) > tolerance) problems.push(`подложка: ${label} ${round(d)}→${round(a)} (${sign(a - d)})`);
  };
  geometry('x', design.x, app.x);
  geometry('y', design.y, app.y);
  // внутри другой текст (214 и 37 в счётчике) — ширина законно другая
  if (design.text === app.text) geometry('ширина', design.w, app.w);
  geometry('высота', design.h, app.h);
  if (!sameColor(design.bg, app.bg)) problems.push(`подложка: фон ${hex(design.bg)}→${hex(app.bg)}`);
  // скругление больше половины высоты — это «пилюля», числа могут быть любыми
  const pill = (box: Box) => box.radius >= box.h / 2;
  if (!(pill(design) && pill(app)) && Math.abs(design.radius - app.radius) > 0.5) {
    problems.push(`подложка: скругление ${round(design.radius)}→${round(app.radius)}`);
  }
  return problems;
}

/**
 * Сопоставляет тексты макета и приложения: одинаковый текст — пара с ближайшим по положению, если он не дальше
 * `maxShift`. Тексты без пары — это обычно другие данные (в моках другие товары и числа) или пропущенный элемент.
 */
export function compareItems(design: Item[], app: Item[], options: CompareOptions): Report {
  const pool = new Map<string, Item[]>();
  for (const item of app) pool.set(item.text, [...(pool.get(item.text) ?? []), item]);
  const diffs: Diff[] = [];
  const onlyDesign: string[] = [];
  let matched = 0;
  for (const item of design) {
    const candidates = pool.get(item.text) ?? [];
    const distance = (other: Item) => Math.hypot(other.x - item.x, other.y - item.y);
    const pair = candidates.reduce<Item | undefined>(
      (best, other) =>
        distance(other) <= options.maxShift && (!best || distance(other) < distance(best)) ? other : best,
      undefined,
    );
    if (pair) candidates.splice(candidates.indexOf(pair), 1);
    if (!pair) {
      onlyDesign.push(item.text);
      continue;
    }
    matched += 1;
    const problems = diffPair(item, pair, options);
    if (problems.length) diffs.push({ text: item.text, y: item.y, problems });
  }
  const onlyApp = [...pool.values()].flat().map((item) => item.text);
  return { matched, total: design.length, diffs, onlyDesign, onlyApp };
}

/** Отчёт для терминала. */
export function formatReport(report: Report, title: string): string {
  const lines = [
    title,
    `Совпало по тексту: ${report.matched} из ${report.total}. Расхождений: ${report.diffs.length}.`,
  ];
  for (const diff of report.diffs) lines.push(`  «${diff.text}» (y ${round(diff.y)}): ${diff.problems.join('; ')}`);
  const list = (items: string[]) => items.map((text) => `«${text}»`).join(', ');
  if (report.onlyDesign.length) lines.push(`Только в макете (${report.onlyDesign.length}): ${list(report.onlyDesign)}`);
  if (report.onlyApp.length) lines.push(`Только в приложении (${report.onlyApp.length}): ${list(report.onlyApp)}`);
  return lines.join('\n');
}
