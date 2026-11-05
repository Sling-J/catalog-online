import type { Attribute, Product } from '@catalog/contract';
import { describe, expect, it } from 'vitest';

import {
  digitsOf,
  draftFromProduct,
  newProductDraft,
  newRow,
  nextSizes,
  productChanges,
  toVariantInputs,
  validateDraft,
  variantsChanged,
} from '../product-draft';

const height: Attribute = {
  id: 'h',
  name: 'Рост',
  position: 0,
  inFilters: true,
  values: ['92', '98', '104', '110', '116', '122', '128'].map((value, position) => ({
    id: `h${value}`,
    value,
    position,
    usageCount: 0,
  })),
};

const variant = (value: string, stock: number) => ({
  id: `v${value}`,
  sku: `KD-${value}`,
  barcode: null,
  price: 18900,
  stock,
  values: [{ attributeId: 'h', attributeName: 'Рост', valueId: `h${value}`, value }],
});

const product: Product = {
  id: 'p',
  shortId: 'abc',
  slug: 'kurtka',
  name: 'Куртка демисезонная',
  description: null,
  categoryId: 'c',
  isVisible: true,
  importedFields: ['name', 'category', 'variants'],
  photos: [],
  variants: [variant('104', 6), variant('110', 3)],
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
};

const row = (value: string, price = '') => ({
  key: value,
  values: [{ attributeId: 'h', value }],
  price,
  stock: 1,
  sku: '',
  barcode: '',
});

describe('черновик товара', () => {
  it('цифры из цены', () => expect(digitsOf('8 200 ₸')).toBe('8200'));

  it('без правок сохранять нечего', () => {
    const draft = draftFromProduct(product);
    expect(productChanges(product, draft)).toEqual({});
    expect(variantsChanged(product, draft)).toBe(false);
  });

  it('правки карточки и остатка', () => {
    const draft = draftFromProduct(product);
    draft.name = ' Куртка ';
    draft.isVisible = false;
    draft.rows[1]!.stock = 0;
    expect(productChanges(product, draft)).toEqual({ name: 'Куртка', isVisible: false });
    expect(variantsChanged(product, draft)).toBe(true);
    expect(toVariantInputs(draft)[0]).toMatchObject({ id: 'v104', sku: 'KD-104', price: 18900, stock: 6 });
  });

  it('чипы размеров — следующие после последнего выбранного', () => {
    expect(nextSizes(height, [])).toHaveLength(7);
    expect(nextSizes(height, [row('98'), row('104'), row('110')])).toEqual(['116', '122', '128']);
    expect(nextSizes(height, [row('128')])).toEqual([]);
  });

  it('новый товар: цена по умолчанию у строк без своей, без размеров — один вариант', () => {
    const draft = {
      ...newProductDraft([height]),
      name: 'Платье',
      price: '8200',
      rows: [row('98'), row('104', '9000')],
    };
    expect(toVariantInputs(draft).map((input) => input.price)).toEqual([8200, 9000]);
    expect(toVariantInputs(draft)[0]).toMatchObject({ sku: null, values: [{ attributeId: 'h', value: '98' }] });
    expect(toVariantInputs({ ...draft, rows: [], stock: 4 })).toEqual([{ price: 8200, stock: 4, values: [] }]);
  });

  it('проверка: название, цена, повтор размера', () => {
    const draft = newProductDraft([height]);
    expect(validateDraft(draft)).toEqual({ name: 'required', price: 'no_price' });
    expect(validateDraft({ ...draft, name: 'Платье', price: '8200', rows: [row('98'), row('98')] })).toEqual({
      variants: 'duplicate',
    });
    expect(validateDraft({ ...draft, name: 'Платье', rows: [row('98', '100'), row('104')] })).toEqual({
      variants: 'no_price',
    });
  });

  it('новая строка: размер свойства, цена по умолчанию, одна штука, свой ключ', () => {
    const first = newRow('h', '134');
    expect(first).toMatchObject({ values: [{ attributeId: 'h', value: '134' }], price: '', stock: 1 });
    expect(newRow(null, '').values).toEqual([]);
    expect(newRow('h', '140').key).not.toBe(first.key);
  });
});
