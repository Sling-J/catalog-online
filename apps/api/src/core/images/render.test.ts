import { readFileSync } from 'node:fs';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { ImageUnreadableError, isHeic, renderImage } from './render.js';

// 400×300; HEIC сделан из того же JPEG (`heif-enc`, кодек HEVC — как у iPhone)
const JPEG = readFileSync(new URL('../../../test/fixtures/photo.jpg', import.meta.url));
const HEIC = readFileSync(new URL('../../../test/fixtures/photo.heic', import.meta.url));

const sizeOf = async (body: Buffer) => {
  const meta = await sharp(body).metadata();
  return { format: meta.format, width: meta.width, height: meta.height, exif: meta.exif };
};

describe('isHeic', () => {
  it('HEIC — да; JPEG и AVIF (его sharp читает сам) — нет', async () => {
    expect(isHeic(HEIC)).toBe(true);
    expect(isHeic(JPEG)).toBe(false);
    expect(isHeic(await sharp(JPEG).avif().toBuffer())).toBe(false);
    expect(isHeic(Buffer.from('short'))).toBe(false);
  });
});

describe('renderImage', () => {
  it('три WebP по ширине, маленькую картинку не увеличивает', async () => {
    const image = await renderImage(JPEG);
    expect(image).toMatchObject({ width: 400, height: 300 });
    expect(await sizeOf(image.variants['320'])).toMatchObject({ format: 'webp', width: 320, height: 240 });
    expect(await sizeOf(image.variants['640'])).toMatchObject({ format: 'webp', width: 400, height: 300 });
    expect(await sizeOf(image.variants['1280'])).toMatchObject({ format: 'webp', width: 400, height: 300 });
  });

  it('HEIC с iPhone открывается', async () => {
    const image = await renderImage(HEIC);
    expect(image).toMatchObject({ width: 400, height: 300 });
    expect(await sizeOf(image.variants['320'])).toMatchObject({ format: 'webp', width: 320, height: 240 });
  });

  it('поворот по EXIF: снимок «боком» становится вертикальным; EXIF (и GPS) не переносится', async () => {
    const rotated = await sharp(JPEG)
      .withMetadata({ orientation: 6 })
      .withExif({ IFD0: { Copyright: 'Айгерим' } })
      .jpeg()
      .toBuffer();
    const image = await renderImage(rotated);
    expect(image).toMatchObject({ width: 300, height: 400 });
    const small = await sizeOf(image.variants['320']);
    expect(small).toMatchObject({ width: 300, height: 400 });
    expect(small.exif).toBeUndefined();
  });

  it('высокая картинка — не выше двух ширин', async () => {
    const tall = await sharp({ create: { width: 200, height: 2000, channels: 3, background: '#fff' } })
      .png()
      .toBuffer();
    const image = await renderImage(tall);
    expect(await sizeOf(image.variants['320'])).toMatchObject({ width: 64, height: 640 });
  });

  it('не картинка или обрезанный файл — ImageUnreadableError', async () => {
    await expect(renderImage(Buffer.from('not an image'))).rejects.toBeInstanceOf(ImageUnreadableError);
    await expect(renderImage(JPEG.subarray(0, 2000))).rejects.toBeInstanceOf(ImageUnreadableError);
    await expect(renderImage(HEIC.subarray(0, 2000))).rejects.toBeInstanceOf(ImageUnreadableError);
  });
});
