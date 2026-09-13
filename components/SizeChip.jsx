'use client';

/**
 * One component for two jobs, exactly as in Figma: read-only availability in
 * the grid, and the editable stock toggle on the product screen. "Available /
 * Sold" is precisely the state being edited, so a second component would be
 * the same thing wearing a hat.
 */
export default function SizeChip({ size, inStock, onToggle, compact = false }) {
  const interactive = typeof onToggle === 'function';
  const Tag = interactive ? 'button' : 'span';
  return (
    <Tag
      {...(interactive
        ? { type: 'button', onClick: onToggle, 'aria-pressed': inStock,
            'aria-label': `${size}: ${inStock ? 'em estoque' : 'esgotado'}` }
        : { 'aria-label': `${size}: ${inStock ? 'em estoque' : 'esgotado'}` })}
      className={[
        'inline-flex items-center justify-center rounded-full border font-semibold tabular-nums transition',
        compact ? 'min-w-[28px] px-2 py-[3px] text-[11px]' : 'min-w-[36px] px-3 py-1.5 text-[13px]',
        inStock ? 'border-ink-900 text-ink-900' : 'border-ink-300 text-ink-300',
        interactive ? 'active:scale-95 cursor-pointer' : '',
      ].join(' ')}
    >
      {size}
    </Tag>
  );
}
