'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** One password, one person. See lib/auth.js for why this is deliberately thin. */
export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? 'não entrou');
      router.push('/'); router.refresh();
    } catch (e) { setError(String(e.message ?? e)); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="flex min-h-dvh flex-col justify-center gap-4 px-8">
      <h1 className="text-[26px] font-bold leading-tight">Ateliê</h1>
      <input
        type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha" autoComplete="current-password"
        className="rounded-md border border-ink-300 bg-surface px-3.5 py-3.5 text-[15px] outline-none focus:border-ink-900"
      />
      {error ? <p className="text-[13px] text-coral">{error}</p> : null}
      <button type="submit" disabled={busy || !password}
        className="rounded-md bg-ink-900 py-4 text-[15px] font-semibold text-surface disabled:opacity-50">
        {busy ? 'Entrando…' : 'Entrar'}
      </button>
      <p className="text-center text-[12px] text-ink-600">
        O link de tamanhos do cliente não precisa de senha.
      </p>
    </form>
  );
}
