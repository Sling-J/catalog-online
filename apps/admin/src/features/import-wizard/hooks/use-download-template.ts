import { downloadImportTemplate } from '@catalog/contract';
import { useMutation } from '@tanstack/react-query';

const TEMPLATE_FILE = 'shablon-tovarov.xlsx';

/** «Скачать шаблон» (FR-A3): файл приходит от API (нужна сессия), браузер сохраняет его как обычную загрузку. */
export function useDownloadTemplate() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await downloadImportTemplate({ parseAs: 'blob', throwOnError: true });
      const url = URL.createObjectURL(data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = TEMPLATE_FILE;
      link.click();
      // ссылку отпускаем после того, как браузер начал загрузку
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
}
