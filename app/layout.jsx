import './globals.css';
import { headers } from 'next/headers';
import { htmlLang, dirOf, LOCALES } from '@/lib/i18n';

export const metadata = {
  title: 'Ateliê — Estoque',
  description: 'Estoque, fotos e tamanhos da loja.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Ateliê' },
};

export const viewport = {
  themeColor: '#F5EDE3',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  // set by middleware for /tamanho; her own screens are always pt-BR
  const h = headers().get('x-atelie-locale');
  const locale = LOCALES.includes(h) ? h : 'pt';

  return (
    <html lang={htmlLang[locale]} dir={dirOf(locale)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${locale === 'ar' ? 'font-arabic' : 'font-sans'} text-ink-900 antialiased`}>
        {/* phone-width column, centred on desktop so it isn't grotesque on a laptop */}
        <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-page">{children}</div>
      </body>
    </html>
  );
}
