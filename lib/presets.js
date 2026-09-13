/**
 * presets.js — the shoot recipe.
 *
 * This file is the most valuable thing in the repo. Everything in it was
 * validated against real garments before being written down:
 *
 *  - RECIPE is frozen. Four generations with four different models produced
 *    an identical frame because these lines were passed verbatim every time.
 *    The one generation that omitted FRAMING cut the model's head off.
 *    Do not "tidy" this prose. It is load-bearing.
 *
 *  - Casting varies on purpose. A single repeated AI face across a catalogue
 *    is what makes people say "this is AI". Different women, same frame.
 *
 *  - There is no 'gulf' market. It was tested and the casting was unreliable
 *    (read closer to South Asian than Khaliji). Re-add it only with evidence.
 *
 *  - COVERAGE IS A COMPOSITION, NOT AN OUTFIT. Asking for "a kaftan over the
 *    bikini" returned a sheer open robe that covered nothing — resortwear
 *    photography is built to show the swimwear. Coverage has to be specified
 *    as what the frame contains.
 */

/** Frozen. Passed verbatim into every prompt. */
export const RECIPE = [
  'SET: warm sand-beige seamless studio background.',
  'LIGHT: single large softbox front-left, soft falloff, visible contact shadow at the feet.',
  'FRAMING: full body head to feet, centred, approximately 15 percent headroom.',
  'LENS: 85mm.',
  'GRADE: warm, slightly lifted blacks.',
  'STYLE: clean minimal editorial catalogue photography.',
].join(' ');

export const MARKETS = {
  brasil: {
    label: 'Brasil',
    casting: 'a Brazilian woman, mid-20s',
    defaultComposition: 'full_body',
  },
  levante: {
    label: 'Levante',
    casting: 'a Lebanese woman with warm olive skin and dark wavy hair, mid-20s',
    defaultComposition: 'sarong',
  },
};

export const COMPOSITIONS = {
  full_body: {
    label: 'Corpo inteiro',
    clause: 'She stands in a relaxed three-quarter pose, arms clear of the body.',
    publicSafe: false,
  },
  sarong: {
    label: 'Canga amarrada',
    // Opaque, tied, and its length stated — vagueness here is what failed before.
    clause:
      'She wears an opaque sarong tied at the waist and falling to mid-calf, ' +
      'fully covering her hips and thighs. Only the top of the garment is visible above the waist.',
    publicSafe: true,
  },
  cropped: {
    label: 'Recorte no busto',
    clause:
      'Crop the frame at the waist so only the upper body and the top of the ' +
      'garment are in shot. Head and shoulders included.',
    publicSafe: true,
    overrideFraming: 'FRAMING: bust-up crop ending at the waist, centred.',
  },
  flatlay: {
    label: 'Só flat-lay',
    clause: null, // no model at all — the safest thing to post publicly
    publicSafe: true,
    noModel: true,
  },
};

/**
 * Build the prompt for one image.
 *
 * @param {object} product  row from `products` — needs kind + print_description
 * @param {string} market   key of MARKETS
 * @param {string} composition key of COMPOSITIONS
 */
export function buildPrompt(product, market, composition) {
  const m = MARKETS[market];
  const c = COMPOSITIONS[composition];
  if (!m) throw new Error(`unknown market: ${market}`);
  if (!c) throw new Error(`unknown composition: ${composition}`);

  const garment = product.kind === 'onepiece' ? 'one-piece swimsuit' : 'bikini';

  // The print description does the heavy lifting. Without it the generator
  // invents a print that merely rhymes with the real one.
  const fidelity =
    `Reproduce the print faithfully: ${product.print_description} ` +
    `Keep motifs, colours and any grid or border lines crisp and correctly aligned. ` +
    `Ignore any hanger, price tag or background clutter in the reference image and ` +
    `render only the garment worn on the body.`;

  if (c.noModel) {
    return [
      `Professional e-commerce flat-lay photograph of the exact ${garment} in the reference image, ` +
        `laid flat and neatly arranged, shot directly from above.`,
      fidelity.replace(' worn on the body', ''),
      RECIPE.replace(
        'FRAMING: full body head to feet, centred, approximately 15 percent headroom.',
        'FRAMING: top-down flat-lay, garment centred with even margins.'
      ),
    ].join(' ');
  }

  const recipe = c.overrideFraming
    ? RECIPE.replace(
        'FRAMING: full body head to feet, centred, approximately 15 percent headroom.',
        c.overrideFraming
      )
    : RECIPE;

  return [
    `Professional e-commerce swimwear catalogue photograph of ${m.casting}.`,
    `She wears the exact ${garment} in the reference image.`,
    fidelity,
    c.clause,
    recipe,
  ].join(' ');
}

/** Images safe to post on a public feed vs. send one-to-one on WhatsApp. */
export function isPublicSafe(composition) {
  return Boolean(COMPOSITIONS[composition]?.publicSafe);
}

