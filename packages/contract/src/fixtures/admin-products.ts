// Товары демо-магазина для админки (T-305): те же товары, что на витрине, плюс заведённые без фото и скрытые —
// покупатели их не видят, поэтому витрина с ними не расходится. Артикулы и штрихкоды придуманы, остаток — в штуках.
// Список, вкладки и счётчики считаются по этим данным так же, как их будет считать API.
import type {
  Attribute,
  Category,
  Product,
  ProductCreate,
  ProductListItem,
  StorefrontProduct,
  Variant,
  VariantInput,
} from '../gen/types.gen.js';
import { createDemoShopData, demoCategories, demoImage, demoQuantityOf } from './demo-shop.js';

const id = (n: number): string => `0192d000-0000-7000-8000-${n.toString(16).padStart(12, '0')}`;

export type AdminFilter = 'all' | 'no_photo' | 'out_of_stock' | 'hidden';
export type AdminSort = 'new' | 'name' | 'price_asc' | 'price_desc' | 'stock_asc';

type Extra = { name: string; slug: string; category: string; price: number; photo?: string; hidden?: boolean };

// заведены в админке, но без фото (их не видно на витрине) или скрыты
const EXTRAS: Extra[] = [
  { name: 'Комбинезон зимний', slug: 'kombinezon-zimnij', category: 'Куртки', price: 29500 },
  { name: 'Варежки детские', slug: 'varezhki-detskie', category: 'Шапки', price: 2900 },
  { name: 'Жилет утеплённый', slug: 'zhilet-uteplyonnyj', category: 'Куртки', price: 9900 },
  { name: 'Ветровка', slug: 'vetrovka', category: 'Куртки', price: 11500 },
  { name: 'Сарафан джинсовый', slug: 'sarafan-dzhinsovyj', category: 'Платья', price: 8900 },
  { name: 'Платье нарядное', slug: 'plate-naryadnoe', category: 'Платья', price: 14500 },
  { name: 'Юбка плиссе', slug: 'yubka-plisse', category: 'Платья', price: 6900 },
  { name: 'Лонгслив полосатый', slug: 'longsliv-polosatyj', category: 'Кофты', price: 4900 },
  { name: 'Водолазка', slug: 'vodolazka', category: 'Кофты', price: 3900 },
  { name: 'Свитшот с принтом', slug: 'svitshot-s-printom', category: 'Кофты', price: 7500 },
  { name: 'Футболка базовая', slug: 'futbolka-bazovaya', category: 'Кофты', price: 2500 },
  { name: 'Рубашка в клетку', slug: 'rubashka-v-kletku', category: 'Кофты', price: 6500 },
  { name: 'Сандалии кожаные', slug: 'sandalii-kozhanye', category: 'Обувь', price: 12900 },
  { name: 'Сапоги резиновые', slug: 'sapogi-rezinovye', category: 'Обувь', price: 8500 },
  { name: 'Тапочки домашние', slug: 'tapochki-domashnie', category: 'Обувь', price: 3500 },
  { name: 'Шарф вязаный', slug: 'sharf-vyazanyj', category: 'Шапки', price: 3900 },
  { name: 'Панама', slug: 'panama', category: 'Шапки', price: 3500 },
  { name: 'Носки, 3 пары', slug: 'noski-3-pary', category: 'Шапки', price: 1900 },
  { name: 'Кепка', slug: 'kepka', category: 'Шапки', price: 3900 },
  { name: 'Перчатки', slug: 'perchatki', category: 'Шапки', price: 2500 },
  {
    name: 'Ветровка лёгкая',
    slug: 'vetrovka-lyogkaya',
    category: 'Куртки',
    price: 13900,
    photo: 'jacket2',
    hidden: true,
  },
  { name: 'Шапка-ушанка', slug: 'shapka-ushanka', category: 'Шапки', price: 5900, photo: 'beanie-gray', hidden: true },
  {
    name: 'Платье праздничное',
    slug: 'plate-prazdnichnoe',
    category: 'Платья',
    price: 16900,
    photo: 'dress-red',
    hidden: true,
  },
];

// порядок «сначала новые»: начало — как строки в макетах AdminPhone (экран 2) и AdminDesk (экран 1)
const ORDER = [
  'kurtka-demisezonnaya',
  'kombinezon-zimnij',
  'dozhdevik-zhyoltyj',
  'krossovki-na-lipuchkah',
  'palto-sherstyanoe',
  'plate-letnee',
  'varezhki-detskie',
];

/** Артикул товара: буквы слов адреса и номер (у вариантов — номер по порядку). */
const skuOf = (slug: string, base: number, index: number): string =>
  `${slug
    .split('-')
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')}-${String(base + index).padStart(4, '0')}`;

const categoryByName = new Map(demoCategories.map((category) => [category.name, category]));
const CREATED_FROM = Date.parse('2026-10-30T12:00:00Z');

const toAdminVariants = (product: StorefrontProduct, base: number, stock: (index: number) => number) =>
  product.variants.map((variant, index) => ({
    id: variant.id,
    sku: skuOf(product.slug, base, index),
    barcode: `48700${String(base * 10 + index).padStart(8, '0')}`,
    price: variant.price,
    stock: stock(index),
    values: variant.valueIds.map((valueId) => {
      const attribute = product.attributes.find((item) => item.values.some((value) => value.id === valueId))!;
      const value = attribute.values.find((item) => item.id === valueId)!;
      return { attributeId: attribute.id, attributeName: attribute.name, valueId, value: value.value };
    }),
  }));

/** Все товары демо-магазина в том виде, в каком их отдаёт админка. */
export const createDemoAdminProducts = (assetBase?: string): Product[] => {
  const { products } = createDemoShopData(assetBase);
  const sized = (name: string) => products.find((product) => product.attributes[0]?.name === name)!;
  const fromStorefront = products.map((product, index) => ({
    slug: product.slug,
    build: (createdAt: string): Product => ({
      id: product.id,
      shortId: product.shortId,
      slug: product.slug,
      name: product.name,
      description: product.description,
      categoryId: product.category?.id ?? null,
      isVisible: true,
      importedFields: ['name', 'category', 'variants'],
      photos: product.photos.map((image, position) => ({
        id: id(5000 + index * 10 + position),
        position,
        status: 'ready',
        image,
      })),
      variants: toAdminVariants(product, 1000 + index * 100 + 1, (i) => demoQuantityOf(product.variants[i]!.id)),
      createdAt,
      updatedAt: createdAt,
    }),
  }));
  const fromExtras = EXTRAS.map((extra, index) => {
    const category = categoryByName.get(extra.category)!;
    // размеры — как у похожих товаров витрины: обувь по размеру, шапки без размеров, остальное по росту
    const template =
      extra.category === 'Обувь' ? sized('Размер обуви') : extra.category === 'Шапки' ? null : sized('Рост');
    const n = 600 + index;
    const shape: StorefrontProduct = {
      ...(template ?? products.find((product) => product.attributes.length === 0)!),
      id: id(n),
      slug: extra.slug,
      variants: (
        template?.variants ?? [{ id: '', valueIds: [], price: 0, stock: { level: 'in', quantity: null } }]
      ).map((variant, i) => ({ ...variant, id: id(n * 20 + i), price: extra.price })),
    };
    return {
      slug: extra.slug,
      build: (createdAt: string): Product => ({
        id: shape.id,
        shortId: `e${index.toString(36).padStart(4, '0')}`,
        slug: extra.slug,
        name: extra.name,
        description: null,
        categoryId: category.id,
        isVisible: !extra.hidden,
        importedFields: [],
        photos: extra.photo
          ? [{ id: id(7000 + index), position: 0, status: 'ready', image: demoImage(extra.photo, assetBase) }]
          : [],
        variants: toAdminVariants(shape, 5000 + index * 100 + 1, (i) => (index * 3 + i * 5) % 9),
        createdAt,
        updatedAt: createdAt,
      }),
    };
  });
  const all = [...fromStorefront, ...fromExtras];
  const ordered = [
    ...ORDER.map((slug) => all.find((item) => item.slug === slug)!),
    ...all.filter((item) => !ORDER.includes(item.slug)),
  ];
  return ordered.map((item, index) => item.build(new Date(CREATED_FROM - index * 3_600_000).toISOString()));
};

/** Категории админки: дерево (в демо — один уровень) с числом товаров. */
export const demoAdminCategories = (products: Product[]): Category[] =>
  demoCategories.map((category, position) => ({
    id: category.id,
    name: category.name,
    parentId: null,
    position,
    productCount: products.filter((product) => product.categoryId === category.id).length,
    children: [],
  }));

const totalStock = (product: Product): number => product.variants.reduce((sum, variant) => sum + variant.stock, 0);

export const toListItem = (product: Product, categories: Category[]): ProductListItem => {
  const prices = product.variants.map((variant) => variant.price);
  const category = categories.find((item) => item.id === product.categoryId);
  return {
    id: product.id,
    name: product.name,
    sku: product.variants[0]!.sku,
    category: category ? { id: category.id, name: category.name } : null,
    price: Math.min(...prices),
    priceVaries: new Set(prices).size > 1,
    totalStock: totalStock(product),
    variantCount: product.variants.length,
    isVisible: product.isVisible,
    cover: product.photos[0]?.image ?? null,
    photoCount: product.photos.length,
  };
};

const matchesFilter = (product: Product, filter: AdminFilter): boolean => {
  if (filter === 'no_photo') return product.photos.length === 0;
  if (filter === 'out_of_stock') return totalStock(product) === 0;
  if (filter === 'hidden') return !product.isVisible;
  return true;
};

/** Числа вкладок и баннера «N без фото». */
export const countProducts = (products: Product[]) => ({
  all: products.length,
  noPhoto: products.filter((product) => matchesFilter(product, 'no_photo')).length,
  outOfStock: products.filter((product) => matchesFilter(product, 'out_of_stock')).length,
  hidden: products.filter((product) => matchesFilter(product, 'hidden')).length,
});

export type AdminListQuery = { q?: string; categoryId?: string; filter?: AdminFilter; sort?: AdminSort };

/** Выборка списка: поиск по названию, артикулу и штрихкоду, категория, вкладка, сортировка. */
export const selectAdminProducts = (products: Product[], query: AdminListQuery): Product[] => {
  const q = query.q?.trim().toLowerCase();
  const found = products.filter(
    (product) =>
      matchesFilter(product, query.filter ?? 'all') &&
      (!query.categoryId || product.categoryId === query.categoryId) &&
      (!q ||
        product.name.toLowerCase().includes(q) ||
        product.variants.some((variant) => variant.sku.toLowerCase().includes(q) || variant.barcode?.includes(q))),
  );
  const price = (product: Product) => Math.min(...product.variants.map((variant) => variant.price));
  const compare: Record<AdminSort, (a: Product, b: Product) => number> = {
    new: (a, b) => b.createdAt.localeCompare(a.createdAt),
    name: (a, b) => a.name.localeCompare(b.name, 'ru'),
    price_asc: (a, b) => price(a) - price(b),
    price_desc: (a, b) => price(b) - price(a),
    stock_asc: (a, b) => totalStock(a) - totalStock(b),
  };
  return found.sort(compare[query.sort ?? 'new']);
};

/** Свойства демо-магазина (рост, размер обуви) со значениями в порядке витрины и числом вариантов с ними. */
export const createDemoAdminAttributes = (products: Product[]): Attribute[] =>
  createDemoShopData().facets.attributes.map((attribute, position) => ({
    id: attribute.id,
    name: attribute.name,
    position,
    inFilters: true,
    values: attribute.values.map((entry, index) => ({
      id: entry.id,
      value: entry.value,
      position: index,
      usageCount: products.reduce(
        (sum, product) =>
          sum + product.variants.filter((variant) => variant.values.some((value) => value.valueId === entry.id)).length,
        0,
      ),
    })),
  }));

/** Значение свойства по тексту; нет такого («Свой размер») — добавляется в конец. `null` — нет такого свойства. */
const valueOf = (attributes: Attribute[], attributeId: string, text: string) => {
  const attribute = attributes.find((item) => item.id === attributeId);
  if (!attribute) return null;
  const trimmed = text.trim();
  let value = attribute.values.find((item) => item.value.toLowerCase() === trimmed.toLowerCase());
  if (!value) {
    value = { id: crypto.randomUUID(), value: trimmed, position: attribute.values.length, usageCount: 0 };
    attribute.values.push(value);
  }
  return { attributeId, attributeName: attribute.name, valueId: value.id, value: value.value };
};

/**
 * Таблица размеров из редактора — как её сохранит API: варианты с id обновляются, без id создаются, артикул без
 * значения придумывается (`<префикс>-<номер>`). Неизвестное свойство — `null` (422).
 */
export const applyVariantInputs = (
  inputs: VariantInput[],
  current: Variant[],
  attributes: Attribute[],
  skuPrefix: string,
): Variant[] | null => {
  const variants: Variant[] = [];
  let next = current.length + 1;
  for (const input of inputs) {
    const values = input.values.map((item) => valueOf(attributes, item.attributeId, item.value));
    if (values.some((value) => value === null)) return null;
    const existing = input.id ? current.find((variant) => variant.id === input.id) : undefined;
    variants.push({
      id: existing?.id ?? crypto.randomUUID(),
      sku: input.sku?.trim() || existing?.sku || `${skuPrefix}-${String(next++).padStart(4, '0')}`,
      barcode: input.barcode?.trim() || null,
      price: input.price,
      stock: input.stock,
      values: values as Variant['values'],
    });
  }
  return variants;
};

/** Новый товар вручную: без фото, ничего не помечено «из Excel». */
export const createAdminProduct = (body: ProductCreate, variants: Variant[]): Product => {
  const now = new Date().toISOString();
  const shortId = Math.random().toString(36).slice(2, 7);
  return {
    id: crypto.randomUUID(),
    shortId,
    slug: `tovar-${shortId}`,
    name: body.name.trim(),
    description: body.description?.trim() || null,
    categoryId: body.categoryId ?? null,
    isVisible: body.isVisible ?? true,
    importedFields: [],
    photos: [],
    variants,
    createdAt: now,
    updatedAt: now,
  };
};
