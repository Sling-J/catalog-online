import handler, { createServerEntry } from '@tanstack/react-start/server-entry';

import { startMocks } from './mocks';

export default createServerEntry({
  async fetch(request, opts) {
    await startMocks();
    return handler.fetch(request, opts);
  },
});
