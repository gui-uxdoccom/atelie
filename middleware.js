import { NextResponse } from 'next/server';
import { resolveLocale } from '@/lib/i18n';

/**
 * Root <html lang> and <dir> have to be right on the DOCUMENT, not just on an
 * inner div — screen readers, search engines and the browser's own text
 * handling all read the document element. But a root layout receives no
 * searchParams, so the resolved locale is passed down as a header instead.
 *
 * Only /tamanho is multilingual; everything else is her pt-BR app.
 */
export function middleware(req) {
  const res = NextResponse.next();
  if (req.nextUrl.pathname.startsWith('/tamanho')) {
    const locale = resolveLocale(
      req.nextUrl.searchParams.get('l'),
      req.headers.get('accept-language') ?? ''
    );
    res.headers.set('x-atelie-locale', locale);
    // No Vary: Accept-Language here on purpose. The route is force-dynamic, so
    // Next already sends `Cache-Control: private, no-store` and strips any Vary
    // as redundant — nothing caches this. If you ever make /tamanho cacheable,
    // you MUST add Vary back, or a CDN will hand a Portuguese page to an
    // Arabic reader.
  }
  return res;
}

export const config = { matcher: ['/tamanho/:path*'] };
