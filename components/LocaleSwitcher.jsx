'use client';

import { LOCALES, LOCALE_NAMES } from '@/lib/i18n';

/**
 * She sends one link; the customer may not be the language it defaults to.
 * Auto-detection from Accept-Language handles most of it, but an Arabic
 * speaker on an English phone is common enough in the Gulf that a visible
 * override is not optional.
 *
 * Full page reload on purpose: switching to Arabic changes `dir` and the font
 * on <html>, which a client-side state flip cannot do cleanly.
 */
export default function LocaleSwitcher({ current }) {
  return (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Language">
      {LOCALES.map((l) => (
        <a
          key={l}
          href={`?l=${l}`}
          hrefLang={l}
          aria-current={l === current ? 'true' : undefined}
          title={LOCALE_NAMES[l]}
          className={[
            'rounded-full px-2 py-1 text-[11px] font-semibold uppercase transition',
            l === current ? 'bg-ink-900 text-surface' : 'text-ink-600',
          ].join(' ')}
        >
          {l}
        </a>
      ))}
    </div>
  );
}
