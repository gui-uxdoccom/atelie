import { sbAdmin } from '@/lib/supabase';
import { isOwner } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')
   .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function POST(req) {
  if (!isOwner()) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { name, kind, price, print_description, flatlay_url } =
    await req.json().catch(() => ({}));
  if (!name || !price) return Response.json({ error: 'nome e preço são obrigatórios' }, { status: 400 });

  const sb = sbAdmin();
  let slug = slugify(name);
  // collision-safe without a round-trip loop: suffix with a short random tail
  const { data: clash } = await sb.from('products').select('id').eq('slug', slug).maybeSingle();
  if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data, error } = await sb.from('products').insert({
    name, slug,
    kind: ['bikini', 'onepiece'].includes(kind) ? kind : 'other',
    price_minor: Math.round(Number(price) * 100),
    print_description: print_description ?? '',
    flatlay_url: flatlay_url || null,
  }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // seed stock rows so the toggles have something to flip
  const parts = data.kind === 'onepiece' ? ['onepiece'] : ['top', 'bottom'];
  await sb.from('stock').insert(
    parts.flatMap((part) => ['P', 'M', 'G'].map((size) => ({
      product_id: data.id, part, size, qty: 0,
    })))
  );

  return Response.json({ ok: true, slug: data.slug, id: data.id });
}
