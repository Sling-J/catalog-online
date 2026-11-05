import { describe, expect, it } from 'vitest';

import { PHOTO_MAX_BYTES } from '../../constants';
import { acceptPhotos, photoContentType } from '../photo-files';

const file = (name: string, type: string, size = 10) => new File([new Uint8Array(size)], name, { type });

describe('photoContentType', () => {
  it('JPEG, PNG, WebP и HEIC — по типу', () => {
    expect(photoContentType(file('a.jpg', 'image/jpeg'))).toBe('image/jpeg');
    expect(photoContentType(file('a.heic', 'image/heic'))).toBe('image/heic');
  });

  it('HEIC без типа (Windows) — по расширению', () => {
    expect(photoContentType(file('IMG_0001.HEIC', ''))).toBe('image/heic');
    expect(photoContentType(file('photo.heif', 'application/octet-stream'))).toBe('image/heif');
  });

  it('остальное — нет', () => {
    expect(photoContentType(file('a.gif', 'image/gif'))).toBeNull();
    expect(photoContentType(file('a.pdf', ''))).toBeNull();
  });
});

describe('acceptPhotos', () => {
  it('берёт подходящие, не больше свободных мест', () => {
    const { accepted, problem } = acceptPhotos([file('1.jpg', 'image/jpeg'), file('2.png', 'image/png')], 1);
    expect(accepted.map((item) => item.file.name)).toEqual(['1.jpg']);
    expect(problem).toBe('limit');
  });

  it('называет первую причину отказа', () => {
    const big = file('big.jpg', 'image/jpeg', PHOTO_MAX_BYTES + 1);
    const { accepted, problem } = acceptPhotos([file('a.gif', 'image/gif'), big, file('ok.webp', 'image/webp')], 5);
    expect(accepted.map((item) => item.contentType)).toEqual(['image/webp']);
    expect(problem).toBe('type');
  });
});
