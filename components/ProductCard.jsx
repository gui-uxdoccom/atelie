import Link from 'next/link';
import SizeChip from './SizeChip';
import { formatMoney, sizeLabel } from '@/lib/i18n';

/** Sizes on the tile: one-pieces have a single row, bikinis follow the top. */
function tileSizes(product) {
  const part = product.kind === 'onepiece' ? 'onepiece' : 'top';
  return ['P', 'M', 'G'].map((size) => ({
    size,
    inStock: (product.stock ?? []).some((s) => s.part === part && s.size === size && s.qty > 0),
  }));
}

export default function ProductCard({ product, href, locale = 'pt' }) {
  const cover = (product.generated_images ?? []).find((g) => g.kept)?.url || product.flatlay_url;

  return (
    <Link
      href={href ?? `/pecas/${product.slug}`}
      className="block overflow-hidden rounded-md bg-surface transition active:scale-[0.99]"
    >
      <div className="aspect-[168/148] w-full bg-backdrop">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
        ) : null}
      </div>
      <div className="px-3 pb-3.5 pt-3">
        <p className="text-sm font-medium leading-tight">{product.name}</p>
        <p className="mt-1 text-[13px] font-semibold text-ink-600">
          {formatMoney(product.price_minor, product.currency, locale)}
        </p>
        {/* dir=ltr: S·M·L always reads small→large, even on an RTL page */}
        <div className="mt-2 flex gap-1.5" dir="ltr">
          {tileSizes(product).map(({ size, inStock }) => (
            <SizeChip key={size} size={sizeLabel(size, locale)} inStock={inStock} compact />
          ))}
        </div>
      </div>
    </Link>
  );
}
