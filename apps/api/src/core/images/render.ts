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
