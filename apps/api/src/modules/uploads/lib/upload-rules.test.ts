import { describe, expect, it } from 'vitest';

import { uploadErrors, uploadKey } from './upload-rules.js';

describe('uploadErrors', () => {
  it('фото и логотип — JPEG, PNG, WebP, HEIC до 15 МБ', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'IMAGE/JPEG']) {
      expect(uploadErrors('product_photo', type, 1000)).toEqual([]);
      expect(uploadErrors('logo', type, 1000)).toEqual([]);
    }
    expect(uploadErrors('logo', 'image/gif', 1000)[0]?.field).toBe('contentType');
    expect(uploadErrors('product_photo', 'image/jpeg', 15 * 1024 * 1024)).toEqual([]);
    expect(uploadErrors('product_photo', 'image/jpeg', 15 * 1024 * 1024 + 1)[0]?.field).toBe('size');
  });

  it('импорт — .xlsx или CSV до 20 МБ', () => {
    const xlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    expect(uploadErrors('import', xlsx, 20 * 1024 * 1024)).toEqual([]);
    expect(uploadErrors('import', 'text/csv', 1)).toEqual([]);
    expect(uploadErrors('import', 'application/vnd.ms-excel', 1)[0]?.field).toBe('contentType');
  });
});

describe('uploadKey', () => {
  it('расширение по типу, без имени файла', () => {
    expect(uploadKey('shop', 'up', 'product_photo', 'image/HEIC')).toBe('uploads/shop/up.heic');
    expect(uploadKey('shop', 'up', 'import', 'text/csv')).toBe('uploads/shop/up.csv');
  });
});
