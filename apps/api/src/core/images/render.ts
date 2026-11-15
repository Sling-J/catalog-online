// Файл запускается и как код потока сжатия (`renderImageIsolated`): в тестах Node сам снимает с него типы, поэтому
// здесь только стираемый TypeScript (без enum, namespace, свойств в параметрах конструктора) и без относительных
// импортов.
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';

import decodeHeic from 'heic-decode';
import sharp, { type Sharp } from 'sharp';

/** Ширины готовых картинок (контракт `Image`, FR-A4): карточка, экран телефона, компьютер. */
export const IMAGE_WIDTHS = ['320', '640', '1280'] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

export type RenderedImage = {
  /** Стороны исходника после поворота по EXIF — для соотношения сторон до загрузки картинки. */
  width: number;
  height: number;
  /** WebP по ширинам. */
  variants: Record<ImageWidth, Buffer>;
};

/** Файл не открывается как картинка (битый, не тот формат) — повтор не поможет. */
export class ImageUnreadableError extends Error {
  constructor(cause: unknown) {
    super('Картинка не читается', { cause });
    this.name = 'ImageUnreadableError';
  }
}

const WEBP_QUALITY = 80;
/** Высота не больше двух ширин: длинная панорама не превратится в картинку 1280×10000. */
const MAX_ASPECT = 2;

/** Марки контейнера HEIF с кодеком HEVC (снимки iPhone); AVIF (`avif`, `avis`) sharp читает сам. */
const HEVC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs']);

/**
 * HEIC ли это: по коробке `ftyp` в начале файла. Готовая сборка sharp HEVC не декодирует (патенты), такие
 * файлы открывает `heic-decode` (libheif в WebAssembly).
 */
export function isHeic(input: Buffer): boolean {
  if (input.length < 16 || input.toString('latin1', 4, 8) !== 'ftyp') return false;
  const boxSize = Math.min(input.readUInt32BE(0), input.length);
  const brands = [input.toString('latin1', 8, 12)];
  for (let offset = 16; offset + 4 <= boxSize; offset += 4) brands.push(input.toString('latin1', offset, offset + 4));
  return brands.some((brand) => HEVC_BRANDS.has(brand));
}

/** Пиксели и стороны исходника, повёрнутые по EXIF. */
async function open(input: Buffer): Promise<{ image: Sharp; width: number; height: number }> {
  if (isHeic(input)) {
    // libheif сам применяет поворот из контейнера (irot/imir) — на выходе картинка как на экране телефона
    const { width, height, data } = await decodeHeic({ buffer: input });
    const image = sharp(Buffer.from(data.buffer, data.byteOffset, data.byteLength), {
      raw: { width, height, channels: 4 },
    });
    return { image, width, height };
  }
  const image = sharp(input, { failOn: 'error' }).autoOrient();
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw new Error('Нет размеров картинки');
  // ориентации 5–8 — поворот на 90°: стороны меняются местами
  const swap = (meta.orientation ?? 1) >= 5;
  return { image, width: swap ? meta.height : meta.width, height: swap ? meta.width : meta.height };
}

/**
 * Исходник → три WebP: по ширине 320/640/1280, без увеличения маленьких, метаданные (EXIF, GPS) не переносятся,
 * цвета — в sRGB. Не открылось — `ImageUnreadableError`.
 */
export async function renderImage(input: Buffer): Promise<RenderedImage> {
  try {
    const { image, width, height } = await open(input);
    const entries = await Promise.all(
      IMAGE_WIDTHS.map(async (size) => {
        const max = Number(size);
        const body = await image
          .clone()
          .resize({ width: max, height: max * MAX_ASPECT, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toBuffer();
        return [size, body] as const;
      }),
    );
    return { width, height, variants: Object.fromEntries(entries) as Record<ImageWidth, Buffer> };
  } catch (error) {
    throw new ImageUnreadableError(error);
  }
}

// ───────── отдельный поток ─────────

/**
 * Потолки потока сжатия. HEIC 12 Мп декодируется в WebAssembly за ~0,4 с, пиксели RGBA — ~50 МБ (вне кучи JS,
 * поэтому памяти куче много не нужно); время — с запасом на 48 Мп и медленный сервер.
 */
export type RenderLimits = { memoryMb: number; timeoutMs: number };
export const RENDER_LIMITS: RenderLimits = { memoryMb: 256, timeoutMs: 60_000 };

const WORKER_KIND = 'catalog:render-image';

type WorkerReply =
  | { ok: true; image: RenderedImage }
  | { ok: false; unreadable: true; message: string }
  | { ok: false; unreadable: false; message: string };

/**
 * `renderImage` в отдельном потоке Node (`worker_threads`) с потолком памяти и времени (T-608, scaling.md SC2):
 * HEIC декодируется в WebAssembly синхронно и в основном потоке остановил бы все запросы процесса на время
 * декодирования (логотип сжимается прямо в запросе `updateShop`, фото — в процессе задач). Поток запускает этот же
 * файл, как `readTableIsolated`. Не уложилось в память или время — `ImageUnreadableError` (повтор не поможет);
 * поток умер без ответа — обычная ошибка (задачу можно повторить).
 */
export function renderImageIsolated(input: Buffer, limits: RenderLimits = RENDER_LIMITS): Promise<RenderedImage> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(import.meta.url), {
      workerData: { kind: WORKER_KIND, input },
      resourceLimits: { maxOldGenerationSizeMb: limits.memoryMb, maxYoungGenerationSizeMb: 32 },
      // вывод потока не нужен (предупреждения Node о снятии типов и т. п.)
      stdout: true,
      stderr: true,
    });
    let settled = false;
    const finish = (run: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      run();
      void worker.terminate();
    };
    const timer = setTimeout(
      () => finish(() => reject(new ImageUnreadableError(new Error('Сжатие не уложилось во время')))),
      limits.timeoutMs,
    );
    worker.once('message', (reply: WorkerReply) =>
      finish(() => {
        if (reply.ok) resolve(fromTransfer(reply.image));
        else if (reply.unreadable) reject(new ImageUnreadableError(new Error(reply.message)));
        else reject(new Error(`Поток сжатия картинки: ${reply.message}`));
      }),
    );
    worker.once('error', (error: Error & { code?: string }) =>
      finish(() => reject(error.code === 'ERR_WORKER_OUT_OF_MEMORY' ? new ImageUnreadableError(error) : error)),
    );
    worker.once('exit', (code) =>
      finish(() => reject(new Error(`Поток сжатия картинки завершился без ответа (код ${code})`))),
    );
  });
}

/** Между потоками `Buffer` приходит как `Uint8Array` — возвращаем `Buffer` без копирования. */
function fromTransfer(image: RenderedImage): RenderedImage {
  const variants = {} as Record<ImageWidth, Buffer>;
  for (const size of IMAGE_WIDTHS) {
    const part = image.variants[size] as Uint8Array;
    variants[size] = Buffer.from(part.buffer, part.byteOffset, part.byteLength);
  }
  return { width: image.width, height: image.height, variants };
}

// код самого потока: запущен из `renderImageIsolated` — сжимает и отвечает
if (!isMainThread && (workerData as { kind?: unknown } | null)?.kind === WORKER_KIND) {
  const data = workerData as { input: Uint8Array };
  const input = Buffer.from(data.input.buffer, data.input.byteOffset, data.input.byteLength);
  renderImage(input).then(
    (image) => parentPort!.postMessage({ ok: true, image } satisfies WorkerReply),
    (error: unknown) =>
      parentPort!.postMessage({
        ok: false,
        unreadable: error instanceof ImageUnreadableError,
        message: String((error as Error)?.cause ?? (error as Error)?.message ?? error),
      } satisfies WorkerReply),
  );
}
