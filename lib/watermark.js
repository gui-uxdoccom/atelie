/**
 * watermark.js — stamp the logo AFTER generation, never during.
 *
 * Image models mangle logos and text: wrong letterforms, melted edges,
 * invented flourishes. Looks fine in a thumbnail, wrong at full size.
 * Compositing here is deterministic and pixel-identical every time.
 */

import sharp from 'sharp';

export const DEFAULTS = {
  widthRatio: 0.16,   // logo spans 16% of image width
  marginRatio: 0.045, // margin from each edge, as a fraction of image width
  opacity: 0.9,
};

/**
 * Pads the logo onto a transparent canvas the size of the target image and
 * composites at 0,0 — sharp's `gravity` ignores explicit margins, so this is
 * the only way to get a predictable inset.
 *
 * @param {Buffer} imageBuf generated photo
 * @param {Buffer} logoBuf  transparent PNG
 * @returns {Promise<Buffer>} JPEG
 */
export async function applyWatermark(imageBuf, logoBuf, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const { width, height } = await sharp(imageBuf).metadata();
  if (!width || !height) throw new Error('could not read image dimensions');

  const logoWidth = Math.round(width * o.widthRatio);
  const margin = Math.round(width * o.marginRatio);

  const logo = await sharp(logoBuf)
    .resize({ width: logoWidth, withoutEnlargement: true })
    .ensureAlpha()
    .toBuffer();
  const { height: logoHeight } = await sharp(logo).metadata();

  const overlay = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{
      input: logo,
      left: Math.max(0, width - logoWidth - margin),
      top: Math.max(0, height - (logoHeight ?? logoWidth) - margin),
    }])
    .png()
    .toBuffer();

  return sharp(imageBuf)
    .composite([{ input: overlay, blend: 'over', opacity: o.opacity }])
    .jpeg({ quality: 92 })
    .toBuffer();
}
