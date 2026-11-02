// Каталоги строк: Vite-плагин Lingui компилирует .po в модуль с `messages`.
declare module '*.po' {
  import type { Messages } from '@lingui/core';

  export const messages: Messages;
}
