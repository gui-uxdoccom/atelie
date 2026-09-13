import Link from 'next/link';
import { notFound } from 'next/navigation';
import StockEditor from '@/components/StockEditor';
import { sbPublic, getProduct, money } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }) {
  let product = null;
  try { product = await getProduct(sbPublic(), params.slug); } catch {}
  if (!product) notFound();

  const images = (product.generated_images ?? []).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const waText = encodeURIComponent(
    `${product.name} — ${money(product.price_minor, product.currency)}`
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1">
        <div className="relative aspect-[390/300] w-full bg-backdrop">
          {product.flatlay_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.flatlay_url} alt={product.name} className="h-full w-full object-cover" />
          ) : null}
          <Link
            href="/" aria-label="Voltar"
            className="absolute left-5 top-[52px] rounded-full bg-surface p-2.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="m15 18-6-6 6-6" stroke="#1F1B16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="space-y-5 px-5 pt-5">
          <header>
            <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
            {product.description?.pt ? (
              <p className="mt-0.5 text-[13px] text-ink-600">{product.description.pt}</p>
            ) : null}
            <p className="mt-1 text-[17px] font-semibold">
              {money(product.price_minor, product.currency)}
            </p>
          </header>

          <StockEditor productId={product.id} kind={product.kind} initial={product.stock} />

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-semibold tracking-wide text-ink-600">
                FOTOS GERADAS&nbsp;&nbsp;·&nbsp;&nbsp;{images.length}
              </h2>
              <Link href={`/pecas/${product.slug}/gerar`} className="text-[13px] font-semibold text-coral">
                Gerar novas
              </Link>
            </div>
            <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
              {images.map((g) => (
                <div key={g.id} className="relative h-[106px] w-20 shrink-0 overflow-hidden rounded-[10px] bg-backdrop">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-surface px-1.5 py-[3px] text-[9px] font-semibold">
                    {g.composition === 'flatlay' ? 'Flat-lay' : g.market === 'levante' ? 'Levante' : 'Brasil'}
                  </span>
                </div>
              ))}
              <Link
                href={`/pecas/${product.slug}/gerar`}
                aria-label="Gerar fotos"
                className="flex h-[106px] w-20 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-ink-300"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 5v14M5 12h14" stroke="#6B6157" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </Link>
            </div>
          </section>
          <div className="h-4" />
        </div>
      </div>

      <div className="sticky bottom-0 bg-surface px-5 pt-3.5 pb-safe">
        <a
          href={`https://wa.me/?text=${waText}`}
          className="block rounded-md bg-instock py-4 text-center text-[15px] font-semibold text-surface active:scale-[0.99] transition"
        >
          Enviar no WhatsApp
        </a>
      </div>
    </div>
  );
}
