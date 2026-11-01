import type { I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { buildPageHead, type PageHead } from '@/shared/lib';

import { FAQ } from '@/pages/landing/lib';

/**
 * Заголовок и превью ссылки лендинга (T-202, NFR-5): что это за сервис, для кого и что бесплатно на пилоте.
 * Частые вопросы — ещё и разметкой schema.org FAQPage.
 */
export function landingHead({ i18n, origin }: { i18n: I18n; origin: string }): PageHead {
  return buildPageHead({
    title: i18n._(msg`catalog·online — онлайн-каталог с размерами и наличием, заказы в WhatsApp`),
    description: i18n._(
      msg`Загрузите Excel из кассы или 1С — покупатели сами видят размеры, цены и наличие, а готовый заказ приходит вам в WhatsApp. Бесплатно на время пилота.`,
    ),
    url: `${origin}/`,
    siteName: 'catalog·online',
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((item) => ({
        '@type': 'Question',
        name: i18n._(item.question),
        acceptedAnswer: { '@type': 'Answer', text: i18n._(item.answer) },
      })),
    },
  });
}
