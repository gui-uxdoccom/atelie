import { createClient } from '@supabase/supabase-js';

/** Browser / RSC reads. Anon key is RLS-gated; safe in the bundle. */
export const sbPublic = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );

/** Server only. Bypasses RLS — never import this into a client component. */
export const sbAdmin = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

/** Products with their stock rows folded in, newest first. */
export async function listProducts(sb) {
  const { data, error } = await sb
    .from('products')
    .select('*, stock(part,size,qty)')
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProduct(sb, slug) {
  const { data, error } = await sb
    .from('products')
    .select('*, stock(part,size,qty), generated_images(id,url,market,composition,kept,created_at)')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data;
}

export const money = (minor, currency = 'AED') =>
  `${currency} ${(minor / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
