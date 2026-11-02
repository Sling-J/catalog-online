import type { Image } from '@catalog/contract';
import { cx, Icon } from '@catalog/ui';

/**
 * Фото товара в списке: обложка или пунктирная рамка с камерой, если фото нет (макеты AdminPhone, экран 2,
 * и AdminDesk, экран 1). На телефоне 56 px, в таблице компьютера 48 px.
 */
export function ProductThumb({ cover, size }: { cover: Image | null; size: 'list' | 'table' }) {
  const box = size === 'list' ? 'size-14 rounded-[14px]' : 'size-12 rounded-xl';
  if (!cover) {
    // рамка снаружи размера, как в макетах (content-box): 56 + 1,5 + 1,5
    return (
      <span
        className={cx(
          'box-content flex flex-none items-center justify-center border-[1.5px] border-dashed border-[#c9c3e3] bg-[#f6f5fb] text-[#8c86b0]',
          box,
        )}
      >
        <Icon name="camera" size={size === 'list' ? 22 : 18} />
      </span>
    );
  }
  return <img src={cover.sizes['320']} alt="" className={cx('flex-none bg-chip-haze object-cover', box)} />;
}
