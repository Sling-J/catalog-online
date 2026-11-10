import { Injectable } from '@nestjs/common';

import type { DbOrTx } from '../../core/db/index.js';
import type { ImportedField } from '../../core/db/schema/index.js';
import { AttributesService } from '../attributes/attributes.service.js';
import { CategoriesService, categoryPathKey } from '../categories/categories.service.js';
import { buildPlan, type ImportPlan, type ImportRow, type PlanVariant } from './lib/import-plan.js';
import { newShortId, slugify } from './lib/slug.js';
import { productImportRepository, type NewProduct, type NewVariant } from './product-import.repository.js';

export type { ImportRow } from './lib/import-plan.js';

export type ImportPreview = {
  actions: ImportPlan['actions'];
  create: number;
  update: number;
  missingInFile: number;
};
export type ImportApplyOptions = {
  /** Артикулы строк с ошибками: в файле они есть — «нет в файле» их не касается. */
  skusInFile: string[];
  /** В сопоставлении есть колонка категории: у новых товаров категория помечается «из Excel». */
  categoryMapped: boolean;
  zeroMissing: boolean;
};
export type ImportApplyResult = { created: number; updated: number; zeroed: number };

/**
 * Запись строк импорта в каталог (FR-A3) — для модуля импорта: он читает файл и проверяет строки, а что с ними
 * станет в товарах, решает и пишет модуль товаров (backend-structure.md, раздел 4). Правила — `lib/import-plan.ts`.
 */
@Injectable()
export class ProductImportService {
  constructor(
    private readonly categories: CategoriesService,
    private readonly attributes: AttributesService,
  ) {}

  /** Предпросмотр: что станет со строками, без записи. */
  async preview(shopId: string, rows: ImportRow[], skusInFile: string[], db: DbOrTx): Promise<ImportPreview> {
    const plan = buildPlan(rows, await productImportRepository.loadIndex(db, shopId), skusInFile);
    return {
      actions: plan.actions,
      create: plan.actions.length - plan.updatedVariants.length,
      update: plan.updatedVariants.length,
      missingInFile: plan.missing.length,
    };
  }

  /**
   * Применить строки. Только внутри транзакции импорта (`tx`): план строится заново по состоянию магазина на этот
   * момент — между предпросмотром и применением товары могли поправить руками. Занятый параллельно артикул
   * роняет транзакцию целиком (уникальный индекс), задача импорта повторится.
   */
  async apply(shopId: string, rows: ImportRow[], options: ImportApplyOptions, tx: DbOrTx): Promise<ImportApplyResult> {
    const index = await productImportRepository.loadIndex(tx, shopId);
    const plan = buildPlan(rows, index, options.skusInFile);

    const categoryIds = await this.resolveCategories(shopId, plan, tx);
    const categoryIdOf = (path: string[] | null) => (path ? (categoryIds.get(categoryPathKey(path)) ?? null) : null);

    // новые товары
    const shortIds = new Set(index.shortIds);
    const importedFields: ImportedField[] = options.categoryMapped
      ? ['name', 'category', 'variants']
      : ['name', 'variants'];
    const newProducts = plan.newProducts.map((product): NewProduct => ({
      name: product.name,
      slug: slugify(product.name),
      shortId: freeShortId(shortIds),
      description: product.description,
      categoryId: categoryIdOf(product.category),
      groupKey: product.groupKey,
      importedFields,
    }));
    const productIds = await productImportRepository.insertProducts(tx, shopId, newProducts);

    // варианты: новые товаров из файла, новые существующих товаров, найденные по артикулу
    const toVariant = (productId: string, variant: PlanVariant, position: number): NewVariant => ({
      productId,
      sku: variant.sku,
      barcode: variant.barcode,
      price: variant.price,
      stock: variant.stock,
      position,
    });
    const newVariants = [
      ...plan.newProducts.flatMap((product, i) =>
        product.variants.map((variant, position) =>
          toVariant(productIds.get(newProducts[i]!.shortId)!, variant, position),
        ),
      ),
      ...plan.addedVariants.flatMap((added) =>
        added.variants.map((variant, i) => toVariant(added.productId, variant, added.firstPosition + i)),
      ),
    ];
    const variantIds = await productImportRepository.insertVariants(tx, shopId, newVariants);
    await productImportRepository.updateVariants(
      tx,
      shopId,
      plan.updatedVariants.map((variant) => ({
        id: variant.variantId,
        price: variant.price,
        stock: variant.stock,
        barcode: variant.barcode,
      })),
    );

    // значения свойств: у найденных вариантов меняются только свойства с непустой ячейкой
    const withValues = [
      ...newVariants.map((variant) => variantIds.get(variant.sku)!),
      ...plan.updatedVariants.map((variant) => variant.variantId),
    ];
    const valuesOf = [
      ...plan.newProducts.flatMap((product) => product.variants),
      ...plan.addedVariants.flatMap((added) => added.variants),
      ...plan.updatedVariants,
    ].map((variant) => variant.attributes);
    const names = newAttributes(valuesOf.flat());
    if (names.length) {
      const attributeIds = await this.attributes.ensureByNames(shopId, names, tx);
      const refs = valuesOf.map((items) =>
        items.map((item) => ({ attributeId: attributeIds.get(item.name.toLowerCase())!, value: item.value })),
      );
      const valueIds = await this.attributes.resolveValues(shopId, refs, tx);
      const firstUpdated = newVariants.length;
      await productImportRepository.clearValues(
        tx,
        shopId,
        refs
          .slice(firstUpdated)
          .flatMap((items, i) =>
            items.map((item) => ({ variantId: withValues[firstUpdated + i]!, attributeId: item.attributeId })),
          ),
      );
      await productImportRepository.insertValues(
        tx,
        valueIds.flatMap((ids, i) => ids.map((attributeValueId) => ({ variantId: withValues[i]!, attributeValueId }))),
      );
    }

    // существующие товары: название и категория (пока на них пометка «из Excel»), ключ группы
    await productImportRepository.renameProducts(
      tx,
      shopId,
      plan.productPatches.flatMap((patch) =>
        patch.name === null ? [] : [{ id: patch.productId, name: patch.name, slug: slugify(patch.name) }],
      ),
    );
    await productImportRepository.setCategories(
      tx,
      shopId,
      plan.productPatches.flatMap((patch) => {
        const categoryId = categoryIdOf(patch.category);
        return categoryId === null ? [] : [{ id: patch.productId, categoryId }];
      }),
    );
    await productImportRepository.setGroupKeys(
      tx,
      shopId,
      plan.productPatches.flatMap((patch) =>
        patch.groupKey === null ? [] : [{ id: patch.productId, groupKey: patch.groupKey }],
      ),
    );
    await productImportRepository.markVariantsImported(tx, shopId, plan.touchedProductIds);

    const zeroed = options.zeroMissing
      ? await productImportRepository.zeroStock(
          tx,
          shopId,
          plan.missing.map((variant) => variant.variantId),
        )
      : 0;

    const affected = new Set([
      ...productIds.values(),
      ...plan.touchedProductIds,
      ...(options.zeroMissing ? plan.missing.map((variant) => variant.productId) : []),
    ]);
    await productImportRepository.recalcTotals(tx, shopId, [...affected]);

    return { created: newVariants.length, updated: plan.updatedVariants.length, zeroed };
  }

  private async resolveCategories(shopId: string, plan: ImportPlan, tx: DbOrTx): Promise<Map<string, string>> {
    const paths = [...plan.newProducts, ...plan.productPatches].flatMap((item) =>
      item.category ? [item.category] : [],
    );
    return paths.length ? this.categories.ensurePaths(shopId, paths, tx) : new Map<string, string>();
  }
}

/**
 * Новое свойство из файла попадает в фильтры витрины, только если разных значений у него немного: колонка вроде
 * «Примечание» или «Поставщик» с сотнями значений иначе превратится в бесполезный фильтр (решение основателя
 * 2026-11-10). Включить фильтр магазин может сам в «Категориях и размерах».
 */
export const FILTER_VALUES_MAX = 30;

function newAttributes(values: { name: string; value: string }[]): { name: string; inFilters: boolean }[] {
  const distinct = new Map<string, { name: string; values: Set<string> }>();
  for (const item of values) {
    const key = item.name.toLowerCase();
    const entry = distinct.get(key) ?? { name: item.name, values: new Set<string>() };
    entry.values.add(item.value.toLowerCase());
    distinct.set(key, entry);
  }
  return [...distinct.values()].map((entry) => ({
    name: entry.name,
    inFilters: entry.values.size <= FILTER_VALUES_MAX,
  }));
}

/** Свободный в магазине код товара для адреса витрины (DM3); занятые — в `taken`, новый добавляется туда же. */
function freeShortId(taken: Set<string>): string {
  for (;;) {
    const shortId = newShortId();
    if (taken.has(shortId)) continue;
    taken.add(shortId);
    return shortId;
  }
}
