import { sbAdmin } from '@/lib/supabase';
import { isOwner } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PARTS = ['top', 'bottom', 'onepiece'];
const SIZES = ['P', 'M', 'G'];

export async function POST(req) {
  if (!isOwner()) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { productId, part, size, inStock } = await req.json().catch(() => ({}));
  if (!productId || !PARTS.includes(part) || !SIZES.includes(size)) {
    return Response.json({ error: 'bad request' }, { status: 400 });
  }

  // qty stays the source of truth; the toggle sets 0 or 1 without clobbering
  // a real count she may have entered elsewhere
  const sb = sbAdmin();
  const { data: existing } = await sb
    .from('stock').select('qty')
    .eq('product_id', productId).eq('part', part).eq('size', size).maybeSingle();

  const qty = inStock ? Math.max(1, existing?.qty ?? 1) : 0;

  const { error } = await sb.from('stock').upsert(
    { product_id: productId, part, size, qty, updated_at: new Date().toISOString() },
    { onConflict: 'product_id,part,size' }
  );
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, qty });
}
