import { setupI18n } from '@lingui/core';
import { messages as uiMessages } from '@catalog/ui/locales/ru.po';

import { messages as appMessages } from './locales/ru.po';

// Свой экземпляр на каждый запрос: на сервере глобальный `i18n` разделили бы все покупатели (ADR 0001).
export function createI18n() {
  return setupI18n({ locale: 'ru', messages: { ru: { ...uiMessages, ...appMessages } } });
}
