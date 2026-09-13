'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * print_description is a first-class field here, not buried in "advanced".
 * It is fed straight into the image prompt — describing the toucan grid
 * explicitly is what kept the motifs intact in testing. Leave it empty and
 * the generator invents a print that merely rhymes with the real one.
 */
export default function NewProductForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', kind: 'bikini', price: '', print_description: '', flatlay_url: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/pecas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? 'não salvou');
      router.push(`/pecas/${json.slug}`);
      router.refresh();
    } catch (e) { setError(String(e.message ?? e)); }
    finally { setBusy(false); }
  };

  const field = 'w-full rounded-md border border-ink-300 bg-surface px-3.5 py-3 text-[15px] outline-none focus:border-ink-900';

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 space-y-4 px-5 pt-safe">
        <Link href="/" className="text-[13px] text-ink-600">← Estoque</Link>
        <h1 className="text-[26px] font-bold leading-tight">Nova peça</h1>

        <label className="block">
          <span className="text-[11px] font-semibold tracking-wide text-ink-600">NOME</span>
          <input className={`${field} mt-1.5`} value={form.name} onChange={set('name')} placeholder="Tucano" />
        </label>

        <div>
          <span className="text-[11px] font-semibold tracking-wide text-ink-600">TIPO</span>
          <div className="mt-1.5 flex gap-2">
            {[['bikini', 'Biquíni'], ['onepiece', 'Maiô']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, kind: v }))}
                className={[
                  'flex-1 rounded-md py-3 text-[14px] font-medium',
                  form.kind === v ? 'bg-ink-900 text-surface' : 'bg-surface text-ink-600 border border-ink-300',
                ].join(' ')}>{l}</button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-[11px] font-semibold tracking-wide text-ink-600">PREÇO (AED)</span>
          <input className={`${field} mt-1.5`} value={form.price} onChange={set('price')}
                 inputMode="numeric" placeholder="320" />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold tracking-wide text-ink-600">FOTO DA PEÇA (URL)</span>
          <input className={`${field} mt-1.5`} value={form.flatlay_url} onChange={set('flatlay_url')}
                 placeholder="https://…" />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold tracking-wide text-ink-600">DESCRIÇÃO DA ESTAMPA</span>
          <textarea rows={4} className={`${field} mt-1.5 leading-snug`}
            value={form.print_description} onChange={set('print_description')}
            placeholder="Quadrados com tucanos, cachos de banana, coqueiros e folhas em azul-marinho, laranja, bege, verde-água e lilás; alças verdes de amarrar." />
          <span className="mt-1.5 block text-[11px] text-ink-600">
            Quanto mais específica, mais fiel sai a foto gerada. Descreva os desenhos e as cores.
          </span>
        </label>

        {error ? <p className="text-[13px] text-coral">{error}</p> : null}
        <div className="h-2" />
      </div>

      <div className="sticky bottom-0 bg-surface px-5 pt-3.5 pb-safe">
        <button type="button" onClick={save} disabled={busy || !form.name || !form.price}
          className="w-full rounded-md bg-coral py-4 text-[15px] font-semibold text-surface disabled:opacity-50">
          {busy ? 'Salvando…' : 'Salvar peça'}
        </button>
      </div>
    </div>
  );
}
