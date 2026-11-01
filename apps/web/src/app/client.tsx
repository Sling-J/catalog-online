import { StartClient } from '@tanstack/react-start/client';
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

import { startMocks } from './mocks';

// Service worker моков должен подняться до гидрации, иначе первые запросы уйдут в сеть.
await startMocks().catch((error: unknown) => console.error('Моки API не запустились', error));

hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>,
);
