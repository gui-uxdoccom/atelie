'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';
import LocaleSwitcher from './LocaleSwitcher';
import { t, questions, dirOf, isRtl, sizeLabel } from '@/lib/i18n';

/**
 * Customer-facing. Four taps, no keyboard, no photo, no measurements.
 * Everything is an option list on purpose — typing a weight into a phone
 * keyboard is where people abandon.
 *
 * RTL notes: every directional utility here is LOGICAL (ms/me, text-start,
 * justify-between) so the same markup mirrors correctly under dir="rtl".
 * The one exception is the back arrow glyph, which has to flip by hand —
 * ← is a literal character, not a layout property.
 */
export default function SizeFinder({ locale = 'pt' }) {
  const S = t(locale);
  const Q = questions(locale);
  const dir = dirOf(locale);
  const rtl = isRtl(locale);
  const arrow = rtl ? '→' : '←';

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (final) => {
    setBusy(true);
    try {
      const r = await fetch('/api/tamanho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...final, locale }),
      });
      setResult(await r.json());
    } catch {
      setResult({ top: 'M', bottom: 'M', note: 'insufficient', available: [], hiddenCount: 0 });
    } finally {
      setBusy(false);
    }
  };

  const choose = (value) => {
    const next = { ...answers, [Q[step].key]: value };
    setAnswers(next);
    if (step + 1 < Q.length) setStep(step + 1);
    else submit(next);
  };

  const restart = () => { setResult(null); setStep(0); setAnswers({}); };

  // ---------------- result ----------------
  if (result) {
    const { top, bottom, note, available = [], hiddenCount = 0 } = result;
    return (
      <div dir={dir} lang={locale} className="flex min-h-dvh flex-col">
        <div className="flex-1 px-5 pt-11">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[25px] font-bold leading-tight">
              {S.resultTitle(available.length)}
            </h1>
            <LocaleSwitcher current={locale} />
          </div>

          <div className="mt-2.5 inline-flex items-center gap-2 rounded-md bg-surface px-3.5 py-2">
            <span className="text-[13px] font-semibold">
              {S.yourSize(sizeLabel(top, locale), sizeLabel(bottom, locale))}
            </span>
            <button type="button" onClick={restart} className="text-[13px] font-medium text-coral">
              {S.change}
            </button>
          </div>

          {note === 'split' ? <p className="mt-3 text-[12px] text-ink-600">{S.splitNote}</p> : null}
          {note === 'insufficient' ? <p className="mt-3 text-[12px] text-ink-600">{S.unsure}</p> : null}

          {available.length === 0 ? (
            <div className="mt-8 rounded-md bg-surface p-5">
              <p className="text-[15px] font-semibold">{S.none}</p>
              <p className="mt-1 text-[13px] text-ink-600">{S.noneSub}</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3.5">
              {available.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale} href="#" />
              ))}
            </div>
          )}

          {hiddenCount > 0 ? (
            <p className="mt-4 text-[12px] text-ink-600">{S.hidden(hiddenCount)}</p>
          ) : null}
          <div className="h-6" />
        </div>

        <div className="sticky bottom-0 bg-surface px-5 pt-3.5 pb-safe">
          <a
            href="https://wa.me/"
            className="block rounded-md bg-instock py-4 text-center text-[15px] font-semibold text-surface"
          >
            {S.talk}
          </a>
        </div>
      </div>
    );
  }

  // ---------------- questions ----------------
  const q = Q[step];
  return (
    <div dir={dir} lang={locale} className="flex min-h-dvh flex-col">
      <div className="flex-1 px-6 pt-10">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold tracking-wide text-ink-600">{S.brand}</span>
          <LocaleSwitcher current={locale} />
        </div>

        <div
          className="mt-6 flex gap-1.5"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={Q.length}
        >
          {Q.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-ink-900' : 'bg-ink-300'}`}
            />
          ))}
        </div>

        <div className="mt-6">
          <p className="text-[12px] font-semibold text-coral">{S.q(step + 1, Q.length)}</p>
          <h1 className="mt-1.5 text-[25px] font-bold leading-tight">{q.q}</h1>
          {step === 0 ? <p className="mt-1.5 text-[13px] text-ink-600">{S.noPhoto}</p> : null}
        </div>

        <div className="mt-6 space-y-2.5">
          {q.options.map((o, i) => (
            <button
              key={i}
              type="button"
              disabled={busy}
              onClick={() => choose(o.value)}
              className="flex w-full items-center justify-between rounded-md border border-ink-300 bg-surface px-[18px] py-4 text-start text-[15px] transition active:scale-[0.99] disabled:opacity-60"
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {step > 0 ? (
        <div className="px-6 pb-safe pt-3.5">
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="text-[13px] text-ink-600"
          >
            {arrow} {S.back}
          </button>
        </div>
      ) : (
        <div className="pb-safe" />
      )}
    </div>
  );
}
