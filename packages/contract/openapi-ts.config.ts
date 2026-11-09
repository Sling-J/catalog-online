import { defineConfig } from '@hey-api/openapi-ts';

// Генерация из контракта (ADR 0001): типы, SDK на fetch, хуки TanStack Query,
// схемы Zod, моки MSW для фронтов и типы контроллеров для NestJS.
export default defineConfig({
  input: './openapi.yaml',
  // `.js` в импортах: API собирается в режиме NodeNext — без расширения типы из dist превращались в any
  // (pitfalls.md, T-407)
  output: { path: './src/gen', module: { extension: '.js' } },
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/typescript',
    '@hey-api/sdk',
    '@tanstack/react-query',
    { name: 'zod', responses: true },
    'msw',
    'nestjs',
  ],
});
