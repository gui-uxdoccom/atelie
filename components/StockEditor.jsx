'use client';

import { useState, useTransition } from 'react';
import SizeChip from './SizeChip';

const SIZES = ['P', 'M', 'G'];
const LABEL = { top: 'Top', bottom: 'Calcinha', onepiece: 'Maiô' };

/**
 * Top and bottom are edited independently — that separation is the whole
 * point. Optimistic toggle: she's standing in the shop and shouldn't wait
 * on a round-trip to see the chip change.
 */
export default function StockEditor({ productId, kind, initial }) {
  const parts = kind === 'onepiece' ? ['onepiece'] : ['top', 'bottom'];
  const key = (part, size) => `${part}:${size}`;

  const [stock, setStock] = useState(() => {
    const m = {};
    for (const s of initial ?? []) m[key(s.part, s.size)] = s.qty > 0;
    return m;
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const toggle = (part, size) => {
    const k = key(part, size);
    const next = !stock[k];
    setStock((s) => ({ ...s, [k]: next }));   // optimistic
    setError(null);
    startTransition(async () => {
      try {
        const r = await fetch('/api/stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, part, size, inStock: next }),
        });
        if (!r.ok) throw new Error(await r.text());
      } catch (e) {
        setStock((s) => ({ ...s, [k]: !next }));  // roll back, don't lie to her
        setError('Não salvou. Tenta de novo.');
      }
    });
  };

  return (
    <section className="rounded-md bg-surface px-4 pb-4 pt-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[11px] font-semibold tracking-wide text-ink-600">EM ESTOQUE</h2>
        {pending ? <span className="text-[11px] text-ink-300">salvando…</span> : null}
      </div>
      <div className="mt-3 space-y-3">
        {parts.map((part) => (
          <div key={part} className="flex items-center gap-2">
            <span className="w-[74px] shrink-0 text-sm font-medium">{LABEL[part]}</span>
            {SIZES.map((size) => (
              <SizeChip
                key={size} size={size}
                inStock={Boolean(stock[key(part, size)])}
                onToggle={() => toggle(part, size)}
              />
            ))}
          </div>
        ))}
      </div>
      {error ? <p className="mt-3 text-[12px] text-coral">{error}</p> : null}
    </section>
  );
}
