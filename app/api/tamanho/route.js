import { sbPublic, sbAdmin, listProducts } from '@/lib/supabase';
import { recommend, filterToSize } from '@/lib/sizing';

export const dynamic = 'force-dynamic';

/** Public: customers reach this from a WhatsApp link. No auth, no PII. */
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { height_cm, weight_kg, bra_band, usual_size, locale = 'pt' } = body;

  const rec = recommend({ height_cm, weight_kg, bra_band, usual_size });

  let products = [];
  try { products = await listProducts(sbPublic()); } catch {}
  const { available, hiddenCount } = filterToSize(products, rec);

  // fire-and-forget: a failed log must never break the customer's answer
  try {
    await sbAdmin().from('size_quiz').insert({
      height_cm: height_cm ?? null,
      weight_kg: weight_kg ?? null,
      bra_band: bra_band ?? null,
      usual_size: usual_size ?? null,
      result_top: rec.top,
      result_bottom: rec.bottom,
      locale,
    });
  } catch {}

  return Response.json({ ...rec, available, hiddenCount });
}
