import { createFileRoute } from '@tanstack/react-router';
import { useCallback } from 'react';

import { ImportPage } from '@/pages/import';

type ImportSearch = { id?: string };

// «Импорт» (FR-A3): открытый импорт — в адресе (`?id=`), шаг мастера — по его статусу с сервера.
export const Route = createFileRoute('/_shell/import')({
  validateSearch: (search: Record<string, unknown>): ImportSearch =>
    typeof search.id === 'string' && search.id ? { id: search.id } : {},
  component: function ImportRoute() {
    const { id } = Route.useSearch();
    const navigate = Route.useNavigate();
    const open = useCallback(
      (importId: string | undefined) => void navigate({ search: importId ? { id: importId } : {}, replace: true }),
      [navigate],
    );
    return <ImportPage importId={id} onOpen={open} />;
  },
});
