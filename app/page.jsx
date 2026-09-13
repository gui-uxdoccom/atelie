import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { sbPublic, listProducts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function StockPage({ searchParams }) {
  let products = [];
  let loadError = null;
  try {
    products = await listProducts(sbPublic());
  } catch (e) {
    loadError = e.message ?? 'não deu pra carregar o estoque';
  }

  const filter = searchParams?.f ?? 'tudo';
  const hasStock = (p) => (p.stock ?? []).some((s) => s.qty > 0);
  const onlyP = (p) => {
    const sizes = new Set((p.stock ?? []).filter((s) => s.qty > 0).map((s) => s.size));
    return sizes.size === 1 && sizes.has('P');
  };
  const shown = products.filter((p) =>
    filter === 'disponivel' ? hasStock(p)
    : filter === 'sop' ? onlyP(p)
    : filter === 'esgotado' ? !hasStock(p)
    : true
  );

  const soldOut = products.filter((p) => !hasStock(p)).length;

  const FILTERS = [
    ['tudo', 'Tudo'], ['disponivel', 'Disponível'], ['sop', 'Só P'], ['esgotado', 'Esgotado'],
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 px-5 pt-safe">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-bold leading-tight">Estoque</h1>
            <p className="text-[13px] text-ink-600">
              {products.length} {products.length === 1 ? 'peça' : 'peças'}
              {soldOut > 0 ? ` · ${soldOut} esgotada${soldOut === 1 ? '' : 's'}` : ''}
            </p>
          </div>
          <div className="h-9 w-9 rounded-full bg-ink-300" aria-hidden />
        </header>

        <form className="mt-5">
          <label className="flex items-center gap-2.5 rounded-md bg-surface px-3.5 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="#6B6157" strokeWidth="2" />
              <path d="m20 20-3.5-3.5" stroke="#6B6157" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              name="q" defaultValue={searchParams?.q ?? ''}
              placeholder="Buscar peça ou estampa"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-600"
            />
          </label>
        </form>

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-0.5">
          {FILTERS.map(([key, label]) => (
            <Link
              key={key} href={key === 'tudo' ? '/' : `/?f=${key}`}
              className={[
                'shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium',
                filter === key ? 'bg-ink-900 text-surface' : 'bg-surface text-ink-600',
              ].join(' ')}
            >
              {label}
            </Link>
          ))}
        </nav>

        {loadError ? (
          <p className="mt-8 rounded-md bg-surface p-4 text-[13px] text-ink-600">
            Não deu pra carregar o estoque. <span className="text-ink-300">({loadError})</span>
          </p>
        ) : shown.length === 0 ? (
          <p className="mt-8 rounded-md bg-surface p-4 text-[13px] text-ink-600">
            Nenhuma peça aqui ainda.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3.5">
            {shown.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
        <div className="h-6" />
      </div>

      <div className="sticky bottom-0 flex items-center gap-2.5 bg-surface px-5 pt-3.5 pb-safe">
        <Link
          href="/pecas/nova"
          className="flex-1 rounded-md bg-coral py-4 text-center text-[15px] font-semibold text-surface active:scale-[0.99] transition"
        >
          +&nbsp;&nbsp;Nova peça
        </Link>
        <Link
          href="/tamanho" target="_blank"
          aria-label="Abrir o link de tamanhos que vai pro cliente"
          className="rounded-md border border-ink-600 px-4 py-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" stroke="#6B6157" strokeWidth="2" strokeLinecap="round" />
            <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" stroke="#6B6157" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
