import { headers } from 'next/headers';
import SizeFinder from '@/components/SizeFinder';
import { resolveLocale, t } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const TITLES = {
  pt: 'Ateliê — achar meu tamanho',
  en: 'Ateliê — find my size',
  ar: 'أتيليه — اعرفي مقاسك',
};

export async function generateMetadata({ searchParams }) {
  const locale = resolveLocale(searchParams?.l, headers().get('accept-language') ?? '');
  return {
    title: TITLES[locale],
    description: t(locale).noPhoto,
    alternates: {
      languages: { 'pt-BR': '/tamanho?l=pt', en: '/tamanho?l=en', ar: '/tamanho?l=ar' },
    },
  };
}

export default function SizePage({ searchParams }) {
  const locale = resolveLocale(searchParams?.l, headers().get('accept-language') ?? '');
  // <html lang>/<dir> and the font are set by the root layout via middleware
  return <SizeFinder locale={locale} />;
}
