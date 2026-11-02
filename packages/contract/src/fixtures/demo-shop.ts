// Демо-магазин «Айгерим Kids» для моков и демо (T-009). Те же товары, что в макетах.
// Фото лежат в design-assets/storefront; приложения отдают их по адресу <assetBase>/demo/<имя>.jpg.
// Контракт требует полные адреса картинок, поэтому данные строятся от базового адреса:
// в моках это адрес приложения, в тестах — значение по умолчанию.
import type {
  Image,
  StockInfo,
  StorefrontCategory,
  StorefrontFacets,
  StorefrontProduct,
  StorefrontProductCard,
  StorefrontShop,
} from '../gen/types.gen.js';

/** Детерминированные UUID в формате v7 — чтобы адреса и снимки тестов не менялись. */
const id = (n: number): string => `0192d000-0000-7000-8000-${n.toString(16).padStart(12, '0')}`;

export const DEFAULT_DEMO_ASSET_BASE = 'http://localhost';

export const demoImage = (name: string, assetBase = DEFAULT_DEMO_ASSET_BASE): Image => {
  const url = `${assetBase}/demo/${name}.jpg`;
  return { width: 800, height: 1000, sizes: { '320': url, '640': url, '1280': url } };
};

export const demoShop: StorefrontShop = {
  subdomain: 'aigerim-kids',
  name: 'Айгерим Kids',
  logo: null,
  description: 'Одежда и обувь для детей от 1 до 10 лет. Новые поступления каждую неделю.',
  address: 'Шымкент, ТЦ «Мега», 2 этаж, бутик 214',
  howToFind: 'Вход со стороны парковки, от эскалатора направо, рядом с фуд-кортом.',
  whatsapp: '+77000000000',
  instagram: '@aigerim.kids',
  schedule: {
    mon: { open: '10:00', close: '20:00' },
    tue: { open: '10:00', close: '20:00' },
    wed: { open: '10:00', close: '20:00' },
    thu: { open: '10:00', close: '20:00' },
    fri: { open: '10:00', close: '20:00' },
    sat: { open: '11:00', close: '20:00' },
    sun: { open: '11:00', close: '18:00' },
  },
  timezone: 'Asia/Almaty',
  stockDisplay: 'levels',
  isPreview: false,
};

export const LOW_STOCK = 2;

/** Поддомен демо-магазина со скрытым каталогом: витрина отвечает 410 и показывает «Каталог сейчас обновляется». */
export const HIDDEN_DEMO_SUBDOMAIN = 'skrytyj-magazin';

type CategoryKey = 'outer' | 'dress' | 'tops' | 'shoes' | 'acc';

const categoryDefs: Record<CategoryKey, { id: string; name: string }> = {
  outer: { id: id(1), name: 'Куртки' },
  dress: { id: id(2), name: 'Платья' },
  tops: { id: id(3), name: 'Кофты' },
  shoes: { id: id(4), name: 'Обувь' },
  acc: { id: id(5), name: 'Шапки' },
};

const heightAttr = { id: id(10), name: 'Рост' };
const shoeAttr = { id: id(11), name: 'Размер обуви' };
const heights = ['92', '98', '104', '110', '116', '122', '128'];
const shoeSizes = ['24', '25', '26', '27', '28', '29', '30', '31'];
const valueId = (attr: 'h' | 's', value: string): string => id((attr === 'h' ? 100 : 300) + Number(value));

type Row = {
  key: number;
  name: string;
  slug: string;
  category: CategoryKey;
  price: number;
  photos: string[];
  description: string;
};

const rows: Row[] = [
  {
    key: 1,
    name: 'Куртка демисезонная',
    slug: 'kurtka-demisezonnaya',
    category: 'outer',
    price: 18900,
    photos: ['jacket', 'jacket2'],
    description: 'Лёгкая куртка на весну и осень, утеплитель 100 г. Капюшон отстёгивается, манжеты на резинке.',
  },
  {
    key: 2,
    name: 'Платье трикотажное',
    slug: 'plate-trikotazhnoe',
    category: 'dress',
    price: 9500,
    photos: ['dress-red'],
    description: 'Мягкий хлопковый трикотаж, не мнётся. Подходит для садика и праздников.',
  },
  {
    key: 3,
    name: 'Кроссовки на липучках',
    slug: 'krossovki-na-lipuchkah',
    category: 'shoes',
    price: 14200,
    photos: ['sneakers-blue'],
    description: 'Лёгкая подошва, дышащий верх. Липучки — ребёнок обувается сам.',
  },
  {
    key: 4,
    name: 'Шапка вязаная',
    slug: 'shapka-vyazanaya',
    category: 'acc',
    price: 4200,
    photos: ['beanie-gray'],
    description: 'Шерсть с акрилом, не колется. Тянется, подходит на обхват 48–54 см.',
  },
  {
    key: 5,
    name: 'Дождевик жёлтый',
    slug: 'dozhdevik-zhyoltyj',
    category: 'outer',
    price: 7900,
    photos: ['raincoat'],
    description: 'Непромокаемый, со светоотражающими полосками. Складывается в карман.',
  },
  {
    key: 6,
    name: 'Джинсовая куртка',
    slug: 'dzhinsovaya-kurtka',
    category: 'outer',
    price: 12500,
    photos: ['denim-jacket'],
    description: 'Плотный деним, хлопок 100%. Кнопки вместо пуговиц.',
  },
  {
    key: 7,
    name: 'Худи с капюшоном',
    slug: 'hudi-s-kapyushonom',
    category: 'tops',
    price: 8900,
    photos: ['hoodie-red'],
    description: 'Футер с начёсом, карман-кенгуру. Не садится после стирки.',
  },
  {
    key: 8,
    name: 'Футболка хлопок',
    slug: 'futbolka-hlopok',
    category: 'tops',
    price: 3500,
    photos: ['tshirt-white'],
    description: 'Базовая белая футболка, хлопок 100%.',
  },
  {
    key: 9,
    name: 'Платье летнее',
    slug: 'plate-letnee',
    category: 'dress',
    price: 8200,
    photos: ['dress-yellow'],
    description: 'Лёгкий хлопок, свободный крой. На жару и для прогулок.',
  },
  {
    key: 10,
    name: 'Кеды',
    slug: 'kedy',
    category: 'shoes',
    price: 11800,
    photos: ['sneakers-pink'],
    description: 'Текстильный верх, резиновая подошва. Шнурки на резинке.',
  },
  {
    key: 11,
    name: 'Пальто шерстяное',
    slug: 'palto-sherstyanoe',
    category: 'outer',
    price: 24900,
    photos: ['coat-white'],
    description: 'Шерсть 70%, подкладка из вискозы. Нарядное, на прохладную погоду.',
  },
  {
    key: 12,
    name: 'Шапка с помпоном',
    slug: 'shapka-s-pomponom',
    category: 'acc',
    price: 4900,
    photos: ['beanies'],
    description: 'Двойная вязка, помпон из искусственного меха.',
  },
  {
    key: 13,
    name: 'Кардиган серый',
    slug: 'kardigan-seryj',
    category: 'tops',
    price: 10400,
    photos: ['cardigan-gray'],
    description: 'Мягкая вязка на пуговицах. Носится поверх футболки и платья.',
  },
  {
    key: 14,
    name: 'Платье в цветочек',
    slug: 'plate-v-czvetochek',
    category: 'dress',
    price: 9900,
    photos: ['dress-floral'],
    description: 'Хлопок с вискозой, пояс завязывается сзади.',
  },
];

const shortIdOf = (key: number): string => `d${key.toString(36).padStart(4, '0')}`;

/** Ключ товара, который раскупили целиком: по старой ссылке открывается экран «Закончился». */
const SOLD_OUT_KEY = 11;

/** Остаток варианта: часть размеров закончилась, часть — «мало». */
const stockOf = (rowKey: number, index: number): number => {
  if (rowKey === SOLD_OUT_KEY) return 0;
  if ((rowKey + index) % 4 === 0) return 0;
  if ((rowKey + index) % 5 === 1) return 1;
  return 3 + ((rowKey * 7 + index) % 6);
};

// остаток в штуках витрина не показывает (уровни), но он нужен админке
const quantities = new Map<string, number>();

/** Остаток варианта демо-магазина в штуках (для списка товаров админки). */
export const demoQuantityOf = (variantId: string): number => quantities.get(variantId) ?? 0;

const stockInfo = (quantity: number): StockInfo => ({
  level: quantity === 0 ? 'out' : quantity <= LOW_STOCK ? 'low' : 'in',
  quantity: null,
});

const buildProduct = (row: Row, assetBase: string): StorefrontProduct => {
  const categoryDef = categoryDefs[row.category];
  const sized = row.category === 'shoes' ? shoeSizes : row.category === 'acc' ? [] : heights;
  const attrKind = row.category === 'shoes' ? 's' : 'h';
  const attr = row.category === 'shoes' ? shoeAttr : heightAttr;
  const variants: StorefrontProduct['variants'] =
    sized.length === 0
      ? [{ id: id(1000 + row.key * 20), valueIds: [], price: row.price, stock: stockInfo(stockOf(row.key, 1)) }]
      : sized.map((value, index) => ({
          id: id(1000 + row.key * 20 + index),
          valueIds: [valueId(attrKind, value)],
          price: row.price,
          stock: stockInfo(stockOf(row.key, index)),
        }));
  variants.forEach((variant, index) => quantities.set(variant.id, stockOf(row.key, sized.length === 0 ? 1 : index)));
  return {
    id: id(500 + row.key),
    shortId: shortIdOf(row.key),
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: { id: categoryDef.id, name: categoryDef.name },
    photos: row.photos.map((name) => demoImage(name, assetBase)),
    attributes:
      sized.length === 0
        ? []
        : [{ id: attr.id, name: attr.name, values: sized.map((value) => ({ id: valueId(attrKind, value), value })) }],
    variants,
  };
};

export type DemoShopData = {
  shop: StorefrontShop;
  products: StorefrontProduct[];
  cards: StorefrontProductCard[];
  categories: StorefrontCategory[];
  facets: StorefrontFacets;
};

/** Все данные демо-магазина с картинками от указанного адреса. */
export const createDemoShopData = (assetBase = DEFAULT_DEMO_ASSET_BASE): DemoShopData => {
  const products = rows.map((row) => buildProduct(row, assetBase));
  return {
    shop: demoShop,
    products,
    cards: products.map(toCard),
    categories: demoCategories,
    facets: buildFacets(products),
  };
};

const cardLevel = (product: StorefrontProduct): StorefrontProductCard['stockLevel'] => {
  const levels = product.variants.map((variant) => variant.stock.level);
  if (levels.includes('in')) return 'in';
  return levels.includes('low') ? 'low' : 'out';
};

const toCard = (product: StorefrontProduct): StorefrontProductCard => ({
  id: product.id,
  shortId: product.shortId,
  slug: product.slug,
  name: product.name,
  price: Math.min(...product.variants.map((variant) => variant.price)),
  priceVaries: new Set(product.variants.map((variant) => variant.price)).size > 1,
  cover: product.photos[0] ?? null,
  stockLevel: cardLevel(product),
});

export const demoCategories: StorefrontCategory[] = (Object.keys(categoryDefs) as CategoryKey[]).map((key) => ({
  id: categoryDefs[key].id,
  name: categoryDefs[key].name,
  productCount: rows.filter((row) => row.category === key).length,
  children: [],
}));

const buildFacets = (products: StorefrontProduct[]): StorefrontFacets => ({
  total: products.length,
  attributes: [
    {
      id: heightAttr.id,
      name: heightAttr.name,
      values: heights.map((value) => ({ id: valueId('h', value), value, count: 0 })),
    },
    {
      id: shoeAttr.id,
      name: shoeAttr.name,
      values: shoeSizes.map((value) => ({ id: valueId('s', value), value, count: 0 })),
    },
  ].map((attribute) => ({
    ...attribute,
    values: attribute.values.map((entry) => ({
      ...entry,
      count: products.filter((product) =>
        product.variants.some((variant) => variant.stock.level !== 'out' && variant.valueIds.includes(entry.id)),
      ).length,
    })),
  })),
  price: {
    min: Math.min(...rows.map((row) => row.price)),
    max: Math.max(...rows.map((row) => row.price)),
  },
});
