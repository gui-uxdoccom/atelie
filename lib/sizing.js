/**
 * sizing.js — four questions to a size. No photos, no tape measure.
 *
 * Be honest about what this is: a heuristic, not a measurement. It gets the
 * common cases right and says so when it isn't sure. That is the whole design.
 *
 * The ranking of signals, strongest first:
 *   1. usual_size  — what she already wears in a brand she knows. Best signal
 *                    by a wide margin, because it's a real fit outcome.
 *   2. bra_band    — drives the top almost entirely.
 *   3. weight/height — only useful for the bottom, and only as a tiebreak.
 *
 * Tops and bottoms are returned separately on purpose. A large share of women
 * are one size up or down between them, and forcing a single size is a
 * meaningful source of returns.
 */

export const SIZES = ['P', 'M', 'G'];
const clamp = (i) => SIZES[Math.max(0, Math.min(SIZES.length - 1, i))];
const idx = (s) => SIZES.indexOf(s);

/** Brazilian band → top size. Bands run 36/38 (P), 40/42 (M), 44/46 (G). */
export function topFromBand(band) {
  if (band == null) return null;
  if (band <= 38) return 'P';
  if (band <= 42) return 'M';
  return 'G';
}

/** BMI-ish fallback for the bottom. Crude, and only used when nothing better exists. */
export function bottomFromBody(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  if (bmi < 21) return 'P';
  if (bmi < 26) return 'M';
  return 'G';
}

/**
 * @param {{height_cm?:number, weight_kg?:number, bra_band?:number, usual_size?:string}} a
 * @returns {{top:string, bottom:string, confidence:'high'|'medium'|'low', note:string|null}}
 */
export function recommend(a = {}) {
  const fromBand = topFromBand(a.bra_band);
  const fromBody = bottomFromBody(a.height_cm, a.weight_kg);
  const usual = SIZES.includes(a.usual_size) ? a.usual_size : null;

  let top, bottom, confidence, note = null;

  if (usual && fromBand) {
    // Two independent signals. If they agree, we're confident. If they
    // disagree we trust the band for the top and the known size for the
    // bottom — that disagreement IS the split-size case, not an error.
    top = fromBand;
    bottom = usual;
    if (fromBand === usual) {
      confidence = 'high';
    } else {
      confidence = 'medium';
      note = 'split'; // UI: "você provavelmente usa tamanhos diferentes em cima e embaixo"
    }
  } else if (usual) {
    top = usual;
    bottom = fromBody ?? usual;
    confidence = fromBody && fromBody !== usual ? 'medium' : 'high';
  } else if (fromBand) {
    top = fromBand;
    bottom = fromBody ?? fromBand;
    confidence = 'medium';
  } else if (fromBody) {
    top = fromBody;
    bottom = fromBody;
    confidence = 'low';
  } else {
    // Nothing usable. Don't guess quietly — say so and offer the human.
    return { top: 'M', bottom: 'M', confidence: 'low', note: 'insufficient' };
  }

  // Never recommend more than one size apart; that's almost always bad input.
  if (Math.abs(idx(top) - idx(bottom)) > 1) {
    bottom = clamp(idx(top) + Math.sign(idx(bottom) - idx(top)));
    confidence = 'low';
  }

  return { top, bottom, confidence, note };
}

/**
 * Filter a catalogue to what actually fits AND is in stock.
 * Returns kept items plus how many were hidden, because the count is shown
 * to the customer rather than silently swallowing half the shop.
 */
export function filterToSize(products, { top, bottom }) {
  const fits = (p) => {
    const need = p.kind === 'onepiece'
      ? [['onepiece', top]]                       // one-pieces follow the top
      : [['top', top], ['bottom', bottom]];
    return need.every(([part, size]) =>
      p.stock?.some((s) => s.part === part && s.size === size && s.qty > 0));
  };
  const available = products.filter(fits);
  return { available, hiddenCount: products.length - available.length };
}

