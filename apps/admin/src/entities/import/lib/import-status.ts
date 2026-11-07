import type { ImportStatus } from '@catalog/contract';

/** API работает над импортом в фоне: ждём и перечитываем. */
export const isImportWorking = (status: ImportStatus): boolean =>
  status === 'parsing' || status === 'previewing' || status === 'applying';

/** Импорт не закончен: новый файл загрузить нельзя (409 `import_in_progress`), раздел открывает его. */
export const isImportOpen = (status: ImportStatus): boolean =>
  isImportWorking(status) || status === 'mapping' || status === 'previewed';

export type ImportStep = 1 | 2 | 3 | 4;

/** Какой шаг мастера «Файл → Колонки → Проверка → Готово» показывает статус. */
export function importStep(status: ImportStatus): ImportStep {
  switch (status) {
    case 'mapping':
      return 2;
    case 'previewing':
    case 'previewed':
      return 3;
    case 'applying':
    case 'done':
      return 4;
    default:
      return 1;
  }
}
