// Сверка экрана приложения с артбордом холста: pnpm design:compare --board <доска> --frame <экран> --url <адрес>.
// Описание и примеры — tools/design-compare/README.md.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { chromium, type Page } from 'playwright-core';

import { blobMap, boardHtml, photoPath, readBoard, readCanvasReadme } from './board.ts';
import { collectItems } from './collect.ts';
import { compareItems, formatReport } from './compare.ts';
import type { Collected, Scope } from './types.ts';

const HELP = `Сверка экрана приложения с артбордом холста.

  pnpm design:compare --board AdminPhone --frame "Товары" --url http://localhost:3012/products

  --board   доска из design/canvas/boards (без .dc.html)
  --frame   номер экрана на доске или часть его заголовка («2», «Ничего не нашлось»)
  --url     экран приложения (дев-сервер должен быть запущен)
  --list    показать экраны доски и выйти
  --init    JS до загрузки страницы приложения (localStorage, сессия моков)
  --before  JS после загрузки (открыть шторку, выбрать строки); можно await
  --wait    пауза после загрузки и после --before, мс (по умолчанию 800)
  --tol     допуск по положению и размеру, px (по умолчанию 1)
  --max-shift  дальше — одинаковый текст считаем другими данными, px (по умолчанию 24)
  --shots   папка для снимков design.png и app.png
  --json    отчёт в JSON`;

const { values: args } = parseArgs({
  options: {
    board: { type: 'string' },
    frame: { type: 'string', default: '1' },
    url: { type: 'string' },
    list: { type: 'boolean', default: false },
    init: { type: 'string' },
    before: { type: 'string' },
    wait: { type: 'string', default: '800' },
    tol: { type: 'string', default: '1' },
    'max-shift': { type: 'string', default: '24' },
    shots: { type: 'string' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
});

if (args.help || !args.board || (!args.url && !args.list)) {
  console.log(HELP);
  process.exit(args.help ? 0 : 2);
}

const DESIGN_ORIGIN = 'http://design.local';
const wait = Number(args.wait);
const blobs = blobMap(readCanvasReadme());
const html = boardHtml(readBoard(args.board), blobs, (file) => `${DESIGN_ORIGIN}/photos/${file}`);
// размер всей доски — из корневого блока артборда
const boardSize = /width: (\d+)px; height: (\d+)px; position: relative/.exec(html);

// установленный Chrome — браузеры playwright не скачиваем
const browser = await chromium.launch({ channel: 'chrome' }).catch((error: unknown) => {
  console.error('Не удалось запустить Chrome: нужен установленный Google Chrome.\n', error);
  process.exit(2);
});

try {
  const designPage = await browser.newPage({
    viewport: { width: Number(boardSize?.[1] ?? 4000), height: Number(boardSize?.[2] ?? 3000) },
  });
  await designPage.route(`${DESIGN_ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith('/photos/')) return route.fulfill({ path: photoPath(path.slice('/photos/'.length)) });
    return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
  });
  await designPage.goto(`${DESIGN_ORIGIN}/board.html`, { waitUntil: 'networkidle' });
  await designPage.evaluate(() => document.fonts.ready);
  const design: Collected = await designPage.evaluate(collectItems, { kind: 'board', frame: args.frame } as Scope);

  if (args.list || !design.frame) {
    if (!design.frame) console.error(`Экран «${args.frame}» на доске ${args.board} не найден.`);
    console.log(design.frames.map((frame) => `  ${frame.title} — ${frame.width}×${frame.height}`).join('\n'));
    process.exit(args.list ? 0 : 2);
  }

  const { width, height } = design.frame;
  const appPage = await browser.newPage({ viewport: { width, height } });
  if (args.init) await appPage.addInitScript(args.init);
  // полоса прокрутки съела бы ширину, а в макете её нет
  await appPage.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = 'html { scrollbar-width: none; }';
      document.head.append(style);
    });
  });
  await appPage.goto(args.url!, { waitUntil: 'networkidle' }).catch((error: unknown) => {
    console.error(`Не открылся ${args.url}: запущен ли дев-сервер? (админка — launch.json «admin-check», порт 3012)`);
    throw error;
  });
  await appPage.waitForTimeout(wait);
  if (args.before) {
    await appPage.evaluate(`(async () => { ${args.before} })()`);
    await appPage.waitForTimeout(wait);
  }
  await appPage.evaluate(() => document.fonts.ready);
  const app: Collected = await appPage.evaluate(collectItems, { kind: 'app' } as Scope);

  if (args.shots) await saveShots(args.shots, designPage, appPage, design.frame);

  const report = compareItems(design.items, app.items, {
    tolerance: Number(args.tol),
    maxShift: Number(args['max-shift']),
  });
  const title = `${args.board} › «${design.frame.title}» (${width}×${height}) ↔ ${args.url}`;
  console.log(args.json ? JSON.stringify(report, null, 2) : formatReport(report, title));
  process.exitCode = report.diffs.length ? 1 : 0;
} finally {
  await browser.close();
}

async function saveShots(dir: string, designPage: Page, appPage: Page, frame: NonNullable<Collected['frame']>) {
  mkdirSync(dir, { recursive: true });
  const clip = { x: frame.x, y: frame.y, width: frame.width, height: frame.height };
  await designPage.screenshot({ path: resolve(dir, 'design.png'), clip });
  await appPage.screenshot({ path: resolve(dir, 'app.png') });
  console.log(`Снимки: ${resolve(dir, 'design.png')}, ${resolve(dir, 'app.png')}`);
}
