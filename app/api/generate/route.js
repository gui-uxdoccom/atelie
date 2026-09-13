/**
 * POST /api/generate
 *
 * The only place REPLICATE_API_TOKEN exists. It must never reach the phone —
 * if it ships inside the PWA or the APK, anyone who unzips the bundle can
 * spend the account dry.
 */

import { sbAdmin } from '@/lib/supabase';
import { isOwner } from '@/lib/auth';
import { buildPrompt, MARKETS, COMPOSITIONS } from '@/lib/presets';
import { applyWatermark } from '@/lib/watermark';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Render allows long requests; generation is slow

const MODEL = 'google/nano-banana-pro';

// CONFIRM against replicate.com/google/nano-banana-pro. The budget guard is
// only as honest as this number.
const EST_COST_PER_IMAGE_USD = 0.14;
const MAX_IMAGES_PER_CALL = 6;

export async function POST(req) {
  if (!isOwner()) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { productId, market, composition, count = 4, logo = true } =
    await req.json().catch(() => ({}));

  if (!productId) return Response.json({ error: 'productId required' }, { status: 400 });
  if (!MARKETS[market])
    return Response.json({ error: `market must be one of ${Object.keys(MARKETS)}` }, { status: 400 });
  if (!COMPOSITIONS[composition])
    return Response.json({ error: `composition must be one of ${Object.keys(COMPOSITIONS)}` }, { status: 400 });

  const n = Math.min(Math.max(parseInt(count, 10) || 1, 1), MAX_IMAGES_PER_CALL);
  const sb = sbAdmin();

  // --- spend guard: check before spending, record after ---
  const today = new Date().toISOString().slice(0, 10);
  const { data: budget } = await sb
    .from('generation_budget').select('*').eq('day', today).maybeSingle();
  const spent = Number(budget?.spent_usd ?? 0);
  const cap = Number(budget?.cap_usd ?? 5);
  if (spent + n * EST_COST_PER_IMAGE_USD > cap) {
    return Response.json(
      { error: 'limite do dia atingido', spent, cap },
      { status: 429 }
    );
  }

  // --- product ---
  const { data: product } = await sb
    .from('products').select('*').eq('id', productId).single();
  if (!product) return Response.json({ error: 'product not found' }, { status: 404 });
  if (!product.flatlay_url)
    return Response.json({ error: 'peça sem foto de referência' }, { status: 400 });

  const prompt = buildPrompt(product, market, composition);
  const results = [];
  const errors = [];

  for (let i = 0; i < n; i++) {
    try {
      const r = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          Prefer: 'wait',
        },
        body: JSON.stringify({
          version: MODEL,
          input: {
            prompt,
            image_input: [product.flatlay_url],
            aspect_ratio: '3:4',
            resolution: '2K',
            output_format: 'jpg',
          },
        }),
      });

      const pred = await r.json();
      if (!r.ok || pred.status === 'failed') {
        errors.push(pred.error || pred.detail || `http ${r.status}`);
        continue;
      }
      const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
      if (!url) { errors.push('sem imagem na resposta'); continue; }

      // --- watermark, then store in our own bucket ---
      // Replicate URLs expire; anything we keep has to be copied out anyway.
      let finalUrl = url;
      const wantLogo = Boolean(logo && process.env.LOGO_URL);
      const [imgBuf, logoBuf] = await Promise.all([
        fetch(url).then((x) => x.arrayBuffer()).then(Buffer.from),
        wantLogo
          ? fetch(process.env.LOGO_URL).then((x) => x.arrayBuffer()).then(Buffer.from)
          : Promise.resolve(null),
      ]);
      const out = wantLogo ? await applyWatermark(imgBuf, logoBuf) : imgBuf;

      const path = `${product.slug}/${Date.now()}-${i}.jpg`;
      const { error: upErr } = await sb.storage
        .from('generated').upload(path, out, { contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      finalUrl = sb.storage.from('generated').getPublicUrl(path).data.publicUrl;

      const { data: row } = await sb.from('generated_images').insert({
        product_id: product.id,
        url: finalUrl,
        market,
        composition,
        has_logo: wantLogo,
        prompt,
        model: MODEL,
        cost_usd: EST_COST_PER_IMAGE_USD,
      }).select().single();

      results.push(row);
    } catch (e) {
      errors.push(String(e?.message ?? e));
    }
  }

  const actual = results.length * EST_COST_PER_IMAGE_USD;
  if (actual > 0) {
    await sb.from('generation_budget').upsert(
      { day: today, spent_usd: spent + actual, cap_usd: cap },
      { onConflict: 'day' }
    );
  }

  return Response.json(
    { images: results, generated: results.length, requested: n, errors,
      spentToday: spent + actual, cap },
    { status: results.length ? 200 : 502 }
  );
}
