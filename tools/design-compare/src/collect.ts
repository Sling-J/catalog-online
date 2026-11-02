// Замеры страницы: выполняется в браузере через page.evaluate, поэтому функция самодостаточна —
// без импортов и внешних переменных.
import type { Collected, Scope } from './types.ts';

/**
 * Тексты внутри области и их оформление. Область — артборд на холсте (по размеру и заголовку над ним)
 * или вся страница приложения. Координаты — от левого верхнего угла области.
 */
export function collectItems(scope: Scope): Collected {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  // любой цвет CSS (hex, rgb, oklab, color-mix) → [r, g, b, a] с a от 0 до 255
  const rgba = (color: string): [number, number, number, number] => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r!, g!, b!, a!];
  };

  let root: Element = document.documentElement;
  let ox = 0;
  let oy = 0;
  let title = document.title;
  const frames: { title: string; width: number; height: number }[] = [];
  if (scope.kind === 'board') {
    const candidates = [...document.querySelectorAll<HTMLElement>('div')].filter(
      (div) => div.style.width.endsWith('px') && div.style.height.endsWith('px') && div.previousElementSibling,
    );
    // артборд — блок с размером экрана, над которым подпись «N. Название»
    const titled = candidates.filter((div) => /^\d+\./.test(div.previousElementSibling!.textContent?.trim() ?? ''));
    for (const div of titled) {
      frames.push({
        title: div.previousElementSibling!.textContent!.trim(),
        width: parseFloat(div.style.width),
        height: parseFloat(div.style.height),
      });
    }
    const wanted = scope.frame;
    const found = titled.find((div, index) =>
      /^\d+$/.test(wanted)
        ? index + 1 === Number(wanted)
        : div.previousElementSibling!.textContent!.toLowerCase().includes(wanted.toLowerCase()),
    );
    if (!found) return { frames, frame: null, items: [] };
    root = found;
    title = found.previousElementSibling!.textContent!.trim();
    const rect = found.getBoundingClientRect();
    ox = rect.left;
    oy = rect.top;
  }
  const frameRect = root.getBoundingClientRect();
  const width = scope.kind === 'board' ? frameRect.width : window.innerWidth;
  const height = scope.kind === 'board' ? frameRect.height : window.innerHeight;

  const visible = (el: Element) =>
    el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true });

  // скругление, которое видно глазом: родитель с overflow: hidden и тем же углом обрезает его своим
  const visibleRadius = (node: Element, rect: DOMRect) => {
    let radius = parseFloat(getComputedStyle(node).borderTopLeftRadius) || 0;
    for (let parent = node.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (style.overflow === 'visible') continue;
      const outer = parent.getBoundingClientRect();
      if (Math.abs(outer.left - rect.left) <= 1 && Math.abs(outer.top - rect.top) <= 1) {
        radius = Math.max(radius, parseFloat(style.borderTopLeftRadius) || 0);
      }
    }
    return radius;
  };

  // ближайший предок с фоном, рамкой или тенью — кнопка, чип, поле, плашка. Высокие блоки (колонка меню,
  // рабочая область, карточка таблицы) — это фон экрана, а не подложка текста
  const MAX_BOX_HEIGHT = 120;
  const boxOf = (el: Element) => {
    let node: Element | null = el;
    for (let depth = 0; node && node !== root && depth < 4; depth += 1, node = node.parentElement) {
      const rect = node.getBoundingClientRect();
      if (rect.height > MAX_BOX_HEIGHT) return null;
      const style = getComputedStyle(node);
      const bg = rgba(style.backgroundColor);
      const border = parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== 'none';
      const shadow = style.boxShadow !== 'none';
      if (bg[3] > 0 || border || shadow || style.backgroundImage !== 'none') {
        return {
          x: rect.left - ox,
          y: rect.top - oy,
          w: rect.width,
          h: rect.height,
          bg,
          radius: visibleRadius(node, rect),
          text: (node.textContent ?? '').replace(/\s+/g, ' ').trim(),
        };
      }
    }
    return null;
  };

  const items: Collected['items'] = [];
  const seen = new Set<Element>();
  const add = (el: Element, text: string, rect: DOMRect, input: boolean) => {
    if (rect.width <= 1 || rect.height <= 1) return; // текст только для экранных дикторов
    const x = rect.left - ox;
    const y = rect.top - oy;
    if (x >= width || y >= height || x + rect.width <= 0 || y + rect.height <= 0) return;
    const style = getComputedStyle(el);
    items.push({
      text,
      x,
      y,
      w: rect.width,
      h: rect.height,
      input,
      fontSize: parseFloat(style.fontSize),
      fontWeight: Number(style.fontWeight),
      letterSpacing: style.letterSpacing === 'normal' ? 0 : parseFloat(style.letterSpacing),
      color: rgba(style.color),
      box: boxOf(el),
    });
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!el || seen.has(el) || ['SCRIPT', 'STYLE', 'OPTION', 'TITLE'].includes(el.tagName) || !visible(el)) continue;
    // свой текст элемента: прямые текстовые узлы вместе («Все» в чипе без счётчика)
    const own = [...el.childNodes].filter((child) => child.nodeType === Node.TEXT_NODE && child.textContent!.trim());
    if (own.length === 0) continue;
    seen.add(el);
    const range = document.createRange();
    range.setStartBefore(own[0]!);
    range.setEndAfter(own[own.length - 1]!);
    const text = own
      .map((child) => child.textContent)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    add(el, text, range.getBoundingClientRect(), false);
  }
  // подсказка в поле — в макете это обычный текст; у поля ширина своя, сравниваем без неё
  for (const input of root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')) {
    if (!visible(input) || !input.placeholder || input.value) continue;
    const style = getComputedStyle(input, '::placeholder');
    const rect = input.getBoundingClientRect();
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.25;
    const top = rect.top + (rect.height - lineHeight) / 2;
    add(input, input.placeholder, new DOMRect(rect.left, top, rect.width, lineHeight), true);
    items[items.length - 1]!.color = rgba(style.color);
  }
  // <select>: показанный вариант
  for (const select of root.querySelectorAll('select')) {
    if (!visible(select)) continue;
    const rect = select.getBoundingClientRect();
    const style = getComputedStyle(select);
    const lineHeight = parseFloat(style.fontSize) * 1.25;
    const left = rect.left + parseFloat(style.paddingLeft);
    const top = rect.top + (rect.height - lineHeight) / 2;
    add(select, select.selectedOptions[0]?.text.trim() ?? '', new DOMRect(left, top, rect.width, lineHeight), true);
  }

  items.sort((a, b) => a.y - b.y || a.x - b.x);
  return { frames, frame: { title, x: ox, y: oy, width, height }, items };
}
