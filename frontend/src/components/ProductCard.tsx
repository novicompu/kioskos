import type { Product } from "../api/types";
import { ChevronRightIcon } from "./icons";
import { ProductImage } from "./ProductImage";

interface Props {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(product)}
      className="card group flex flex-col overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]"
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-[var(--color-surface-sunken)]">
        <ProductImage src={product.imagenes[0]} alt={product.nombre} />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <p className="line-clamp-2 min-h-[2.6rem] text-sm font-semibold leading-snug text-[var(--color-ink)]">
          {product.nombre}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-display text-base font-extrabold text-[var(--color-brand)]">
            ${product.precio_formateado}
          </span>
          <span className="flex items-center gap-0.5 text-xs font-semibold text-[var(--color-muted)] transition group-hover:text-[var(--color-brand)]">
            Stock
            <ChevronRightIcon width={14} height={14} />
          </span>
        </div>
      </div>
    </button>
  );
}
