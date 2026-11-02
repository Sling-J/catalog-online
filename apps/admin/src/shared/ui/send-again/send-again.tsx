import { Button, type ButtonVariant } from '@catalog/ui';
import { Plural } from '@lingui/react/macro';
import { useEffect, type ReactNode } from 'react';

import { useCooldown } from '@/shared/hooks';

import { FormNote } from '../form-note';

const COOLDOWN_SECONDS = 45;

/**
 * «Отправить ещё раз» с паузой между письмами (макет «Проверьте почту»: под кнопкой «Повторно — через 45 секунд»).
 * `coolingFromStart` — письмо только что ушло, пауза идёт сразу.
 */
export function SendAgain({
  children,
  variant,
  coolingFromStart,
  pending,
  onSend,
}: {
  children: ReactNode;
  variant: ButtonVariant;
  coolingFromStart?: boolean;
  pending?: boolean;
  /** Отправить письмо; `true` — ушло, пауза начинается. */
  onSend: () => Promise<boolean>;
}) {
  const { left, start } = useCooldown(COOLDOWN_SECONDS);
  useEffect(() => {
    if (coolingFromStart) start();
    // пауза — только при первом показе
  }, []);

  return (
    <>
      {/* во время паузы кнопка выглядит как обычно (макет «Проверьте почту»), паузу показывает подпись */}
      <Button
        variant={variant}
        size="form"
        block
        aria-disabled={left > 0 || pending}
        className="mt-6 lg:mt-[26px]"
        onClick={() => {
          if (left > 0 || pending) return;
          void onSend().then((sent) => sent && start());
        }}
      >
        {children}
      </Button>
      {left > 0 && (
        <FormNote>
          <Plural
            value={left}
            one="Повторно — через # секунду"
            few="Повторно — через # секунды"
            other="Повторно — через # секунд"
          />
        </FormNote>
      )}
    </>
  );
}
