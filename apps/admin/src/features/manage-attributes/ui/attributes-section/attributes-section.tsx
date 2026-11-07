import type { Attribute } from '@catalog/contract';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { attributesQueryOptions } from '@/entities/attribute';
import { ConfirmSheet, FormError } from '@/shared/ui';

import { useAttributeActions } from '../../hooks';
import { AttributeCard } from '../attribute-card';
import { AttributeSheet } from '../attribute-sheet';
import { ValueSheet } from '../value-sheet';

type Value = Attribute['values'][number];
type SheetState<T> = { open: boolean; key: number; item: T };

/**
 * «Размеры и другие свойства» (FR-A6; макет AdminPhone2): «+ Свойство», карточки свойств — раскрыта одна (сначала
 * первая), в ней значения чипами; «в фильтрах» — показывать ли свойство в фильтрах витрины. Пусто — пояснение.
 */
export function AttributesSection() {
  const { t } = useLingui();
  const { data: attributes } = useSuspenseQuery(attributesQueryOptions());
  const actions = useAttributeActions();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expanded = attributes.find((item) => item.id === expandedId) ?? attributes[0];
  // ключ пересоздаёт форму шторки на каждое открытие, содержимое остаётся на время анимации закрытия
  const [attributeSheet, setAttributeSheet] = useState<SheetState<Attribute | null>>({
    open: false,
    key: 0,
    item: null,
  });
  const [valueSheet, setValueSheet] = useState<SheetState<{ attributeId: string; value: Value } | null>>({
    open: false,
    key: 0,
    item: null,
  });
  const [deleting, setDeleting] = useState<Attribute | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const openAttribute = (item: Attribute | null) =>
    setAttributeSheet((state) => ({ open: true, key: state.key + 1, item }));
  const valueAttribute = attributes.find((item) => item.id === valueSheet.item?.attributeId) ?? null;

  return (
    <section className="px-4 pt-[18px] pb-8 lg:px-0 lg:pt-[22px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold">
          <Trans>Размеры и другие свойства</Trans>
        </h2>
        <button
          type="button"
          onClick={() => openAttribute(null)}
          className="text-[14px] font-semibold text-iris hover:underline"
        >
          <Trans>+ Свойство</Trans>
        </button>
      </div>

      {attributes.length === 0 ? (
        <div className="mt-2.5 rounded-[18px] bg-white p-3.5 text-[14px] leading-[1.45] text-ink-quiet shadow-[0_1px_0_#eceaf5]">
          <Trans>
            Свойств пока нет. Размер, рост или цвет — то, чем различаются варианты одного товара. Появятся из Excel или
            добавьте сами.
          </Trans>
        </div>
      ) : (
        attributes.map((attribute, index) => (
          <AttributeCard
            key={attribute.id}
            attribute={attribute}
            first={index === 0}
            expanded={attribute.id === expanded?.id}
            onExpand={() => setExpandedId(attribute.id)}
            onEdit={() => openAttribute(attribute)}
            onInFilters={(inFilters) => actions.setInFilters(attribute, inFilters)}
            onReorderValues={(ids) => actions.reorderValues(attribute, ids)}
            onOpenValue={(value) =>
              setValueSheet((state) => ({ open: true, key: state.key + 1, item: { attributeId: attribute.id, value } }))
            }
            onAddValue={(value) =>
              actions.saveValues(attribute, [
                ...attribute.values.map((entry) => ({ id: entry.id, value: entry.value })),
                { value },
              ])
            }
          />
        ))
      )}
      {actions.failed && <FormError>{t`Не сохранилось. Проверьте интернет и попробуйте ещё раз.`}</FormError>}

      <AttributeSheet
        key={`attribute-${attributeSheet.key}`}
        open={attributeSheet.open}
        attribute={attributeSheet.item}
        actions={actions}
        onClose={() => setAttributeSheet((state) => ({ ...state, open: false }))}
        onCreated={(attribute) => setExpandedId(attribute.id)}
        onDelete={(attribute) => {
          setAttributeSheet((state) => ({ ...state, open: false }));
          actions.remove.reset();
          setDeleting(attribute);
          setConfirmOpen(true);
        }}
      />
      <ValueSheet
        key={`value-${valueSheet.key}`}
        open={valueSheet.open}
        attribute={valueAttribute}
        value={valueSheet.item?.value ?? null}
        actions={actions}
        onClose={() => setValueSheet((state) => ({ ...state, open: false }))}
      />
      <DeleteConfirm
        attribute={deleting}
        open={confirmOpen}
        pending={actions.remove.isPending}
        failed={actions.remove.isError}
        onConfirm={(attribute) =>
          actions.remove.mutate({ path: { attributeId: attribute.id } }, { onSuccess: () => setConfirmOpen(false) })
        }
        onClose={() => setConfirmOpen(false)}
      />
    </section>
  );
}

/** «Удалить свойство?»: сколько вариантов его потеряют. Вернуть нельзя. */
function DeleteConfirm({
  attribute,
  open,
  pending,
  failed,
  onConfirm,
  onClose,
}: {
  attribute: Attribute | null;
  open: boolean;
  pending: boolean;
  failed: boolean;
  onConfirm: (attribute: Attribute) => void;
  onClose: () => void;
}) {
  const { t } = useLingui();
  const name = attribute?.name ?? '';
  const used = attribute?.values.reduce((sum, entry) => sum + entry.usageCount, 0) ?? 0;
  return (
    <ConfirmSheet
      open={open}
      title={<Trans>Удалить свойство «{name}»?</Trans>}
      text={
        <>
          {used > 0 ? (
            <Plural
              value={used}
              one={`У # варианта пропадёт «${name}». Сами варианты, цены и остатки останутся.`}
              other={`У # вариантов пропадёт «${name}». Сами варианты, цены и остатки останутся.`}
            />
          ) : (
            <Trans>В товарах оно не используется.</Trans>
          )}
          {failed && (
            <span role="alert" className="mt-2 block text-[13px] text-coral-underside">
              {t`Не получилось удалить. Проверьте интернет и попробуйте ещё раз.`}
            </span>
          )}
        </>
      }
      confirm={<Trans>Удалить</Trans>}
      cancel={<Trans>Оставить</Trans>}
      pending={pending}
      onConfirm={() => attribute && onConfirm(attribute)}
      onClose={onClose}
    />
  );
}
