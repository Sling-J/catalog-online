import { setupI18n } from '@lingui/core';
import { messages as uiMessages } from '@catalog/ui/locales/ru.po';

import { messages as appMessages } from './locales/ru.po';

export function createI18n() {
  return setupI18n({ locale: 'ru', messages: { ru: { ...uiMessages, ...appMessages } } });
}
