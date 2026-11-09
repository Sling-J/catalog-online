import type { VariantInput } from '@catalog/contract';
import { Injectable } from '@nestjs/common';

import type { DbOrTx } from '../../core/db/index.js';
import { AppError, type FieldError } from '../../core/errors/index.js';
import { generateSkus } from './lib/slug.js';
import { cleanVariants, variantTableErrors, type CleanVariant } from './lib/variants.js';
import { productsRepository, type ProductRow } from './products.repository.js';
import { variantsRepository, type VariantFields } from './variants.repository.js';

/**
 * Таблица размеров товара целиком (`PUT …/variants`, создание товара): строки с id обновляются, без id
 * создаются, остальные удаляются; «Свой размер» добавляется в свойство; цена и остаток товара пересчитываются.
 */
@Injectable()
export class ProductVariantsService {
  /** Только внутри транзакции (`tx`) и под блокировкой товара. */
  async replace(tx: DbOrTx, shopId: string, product: ProductRow, inputs: VariantInput[]): Promise<void> {
    const rows = cleanVariants(inputs);
    const tableErrors = variantTableErrors(rows);
    if (tableErrors.length) throw new AppError('validation_failed', 422, { errors: tableErrors });

    const existing = await variantsRepository.listForProducts(tx, shopId, [product.id]);
    const existingIds = new Set(existing.map((variant) => variant.id));
    const foreign = rows.flatMap((row, i): FieldError[] =>
      row.id && !existingIds.has(row.id) ? [{ field: `variants.${i}.id`, code: 'not_found' }] : [],
    );
    if (foreign.length) throw new AppError('validation_failed', 422, { errors: foreign });

    const valueIds = await this.resolveValues(tx, shopId, rows);

    // артикул стёрли у существующей строки — остаётся прежний (как в моках); у новой — придумываем
    const existingSku = new Map(existing.map((variant) => [variant.id, variant.sku]));
    const skus = rows.map((row) => row.sku ?? (row.id ? existingSku.get(row.id)! : null));
    const manualSkus = rows.flatMap((row) => (row.sku ? [row.sku] : []));
    if ((await variantsRepository.skusTakenElsewhere(tx, shopId, product.id, manualSkus)).length) {
      throw new AppError('sku_taken', 409);
    }
    const missing = skus.filter((sku) => sku === null).length;
    const prefixTaken = missing
      ? await variantsRepository.skusWithPrefix(tx, shopId, product.shortId.toUpperCase())
      : [];
    const taken = new Set([...prefixTaken, ...skus.filter((sku) => sku !== null)]);
    const generated = generateSkus(product.shortId, missing, taken);

    const fields = rows.map((row, position): VariantFields => ({
      sku: skus[position] ?? generated.shift()!,
      barcode: row.barcode,
      price: row.price,
      stock: row.stock,
      position,
    }));

    const keepIds = rows.flatMap((row) => (row.id ? [row.id] : []));
    await variantsRepository.deleteExcept(tx, shopId, product.id, keepIds);
    await variantsRepository.parkSkus(tx, shopId, keepIds);
    const variantIds: string[] = [];
    const created = rows.flatMap((row, i) => (row.id ? [] : [fields[i]!]));
    const createdIds = await variantsRepository.insertMany(tx, shopId, product.id, created);
    for (const [i, row] of rows.entries()) {
      if (row.id) {
        await variantsRepository.update(tx, shopId, row.id, fields[i]!);
        variantIds.push(row.id);
      } else {
        variantIds.push(createdIds.shift()!);
      }
    }
    await variantsRepository.replaceValues(
      tx,
      keepIds,
      rows.flatMap((row, i) =>
        valueIds[i]!.map((attributeValueId) => ({ variantId: variantIds[i]!, attributeValueId })),
      ),
    );
    await productsRepository.recalcTotals(tx, shopId, product.id);
    await productsRepository.touch(tx, shopId, product.id);
  }

  /**
   * Id значений свойств по тексту для каждой строки. Неизвестное свойство — 422 по ячейке; значения, которого
   * нет («Свой размер»), — создаётся в конце свойства. Сравнение без учёта регистра.
   */
  private async resolveValues(tx: DbOrTx, shopId: string, rows: CleanVariant[]): Promise<string[][]> {
    const attributeIds = [...new Set(rows.flatMap((row) => row.values.map((item) => item.attributeId)))];
    const known = new Set((await variantsRepository.findAttributes(tx, shopId, attributeIds)).map((a) => a.id));
    const unknown = rows.flatMap((row, i) =>
      row.values.flatMap((item, j): FieldError[] =>
        known.has(item.attributeId) ? [] : [{ field: `variants.${i}.values.${j}.attributeId`, code: 'not_found' }],
      ),
    );
    if (unknown.length) throw new AppError('validation_failed', 422, { errors: unknown });

    const keyOf = (attributeId: string, value: string) => `${attributeId}:${value.toLowerCase()}`;
    const load = async () =>
      new Map(
        (await variantsRepository.valuesOfAttributes(tx, shopId, attributeIds)).map((value) => [
          keyOf(value.attributeId, value.value),
          value,
        ]),
      );
    let values = await load();
    const nextPosition = new Map<string, number>();
    for (const value of values.values()) {
      nextPosition.set(value.attributeId, Math.max(nextPosition.get(value.attributeId) ?? 0, value.position + 1));
    }
    const toCreate = new Map<string, { attributeId: string; value: string; position: number }>();
    for (const row of rows) {
      for (const item of row.values) {
        const key = keyOf(item.attributeId, item.value);
        if (values.has(key) || toCreate.has(key)) continue;
        const position = nextPosition.get(item.attributeId) ?? 0;
        nextPosition.set(item.attributeId, position + 1);
        toCreate.set(key, { attributeId: item.attributeId, value: item.value, position });
      }
    }
    if (toCreate.size) {
      await variantsRepository.insertValues(tx, shopId, [...toCreate.values()]);
      values = await load();
    }
    return rows.map((row) => row.values.map((item) => values.get(keyOf(item.attributeId, item.value))!.id));
  }
}
