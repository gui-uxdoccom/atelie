'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MARKETS, COMPOSITIONS, isPublicSafe } from '@/lib/presets';

const EST_PER_IMAGE = 0.14; // keep in step with api/generate

export default function GenerateForm({ product }) {
  const router = useRouter();
  const [market, setMarket] = useState('brasil');
  const [composition, setComposition] = useState(MARKETS.brasil.defaultComposition);
  const [logo, setLogo] = useState(true);
  const [count, setCount] = useState(4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const pickMarket = (k) => {
    setMarket(k);
    setComposition(MARKETS[k].defaultComposition); // sensible default, still overridable
  };

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, market, composition, count, logo }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? 'falhou');
      router.push(`/pecas/${product.slug}`);
      router.refresh();
    } catch (e) {
      setError(String(e.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const est = (count * EST_PER_IMAGE * 3.67).toFixed(2); // USD → AED, roughly

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 space-y-6 px-5 pt-safe">
        <header>
          <Link href={`/pecas/${product.slug}`} className="text-[13px] text-ink-600">← Voltar</Link>
          <h1 className="mt-2 text-[26px] font-bold leading-tight">Gerar fotos</h1>
          <p className="text-[13px] text-ink-600">
            {product.name} · {product.kind === 'onepiece' ? 'maiô' : 'biquíni'}
          </p>
        </header>

        {!product.print_description ? (
          <p className="rounded-md border border-coral/40 bg-surface p-3 text-[12px] text-ink-600">
            Essa peça não tem descrição da estampa. As fotos vão sair parecidas, mas não fiéis.
          </p>
        ) : null}

        <section>
          <h2 className="text-[11px] font-semibold tracking-wide text-ink-600">MERCADO</h2>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {Object.entries(MARKETS).map(([k, m]) => (
              <button
                key={k} type="button" onClick={() => pickMarket(k)} aria-pressed={market === k}
                className={[
                  'rounded-md bg-surface p-3.5 text-left transition',
                  market === k ? 'border-2 border-coral' : 'border border-ink-300',
                ].join(' ')}
              >
                <span className="block h-[74px] w-full rounded-sm bg-backdrop" />
                <span className="mt-2.5 block text-[15px] font-semibold">{m.label}</span>
                <span className="block text-[11px] text-ink-600">
                  {COMPOSITIONS[m.defaultComposition].label}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-semibold tracking-wide text-ink-600">COMPOSIÇÃO</h2>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {Object.entries(COMPOSITIONS).map(([k, c]) => (
              <button
                key={k} type="button" onClick={() => setComposition(k)} aria-pressed={composition === k}
                className={[
                  'rounded-[12px] px-3 py-3.5 text-[12px] font-medium transition',
                  composition === k ? 'bg-ink-900 text-surface' : 'bg-surface text-ink-600',
                ].join(' ')}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-600">
            {isPublicSafe(composition)
              ? 'Pode postar no feed público.'
              : 'Melhor mandar no WhatsApp do que postar no feed.'}
          </p>
        </section>

        <section className="rounded-md bg-surface">
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-[15px] font-medium">Marca d’água</p>
              <p className="text-[11px] text-ink-600">Ligada para redes, desligada pro site</p>
            </div>
            <button
              type="button" role="switch" aria-checked={logo} onClick={() => setLogo((v) => !v)}
              className={[
                'flex h-7 w-[46px] items-center rounded-full px-[3px] transition',
                logo ? 'justify-end bg-instock' : 'justify-start bg-ink-300',
              ].join(' ')}
            >
              <span className="h-[22px] w-[22px] rounded-full bg-surface" />
            </button>
          </div>
          <div className="h-px bg-ink-300/60" />
          <div className="flex items-center justify-between px-4 py-4">
            <p className="text-[15px] font-medium">Quantas fotos</p>
            <div className="flex gap-1.5">
              {[2, 4, 6].map((n) => (
                <button
                  key={n} type="button" onClick={() => setCount(n)} aria-pressed={count === n}
                  className={[
                    'rounded-full border px-3.5 py-1.5 text-[13px] font-semibold',
                    count === n ? 'border-ink-900 bg-ink-900 text-surface' : 'border-ink-300 text-ink-600',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error ? <p className="text-[13px] text-coral">{error}</p> : null}
        <div className="h-2" />
      </div>

      <div className="sticky bottom-0 bg-surface px-5 pt-3.5 pb-safe">
        <button
          type="button" onClick={submit} disabled={busy}
          className="w-full rounded-md bg-coral py-4 text-[15px] font-semibold text-surface disabled:opacity-60 active:scale-[0.99] transition"
        >
          {busy ? 'Gerando…' : `Gerar ${count} fotos`}
        </button>
        <p className="mt-2 text-center text-[11px] text-ink-600">
          ≈ AED {est}&nbsp;&nbsp;·&nbsp;&nbsp;leva uns {count * 10} segundos
        </p>
      </div>
    </div>
  );
}
