import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { startMocks } from './mocks';
import { createAppRouter } from './router';
import './styles.css';

// Service worker моков должен подняться до первых запросов.
await startMocks().catch((error: unknown) => console.error('Моки API не запустились', error));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={createAppRouter()} />
  </StrictMode>,
);
