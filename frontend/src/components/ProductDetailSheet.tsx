import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Product, ProductDetailResponse, StockEntry } from "../api/types";
import { CloseIcon, BuildingIcon, AlertIcon, BoxIcon, ExpandIcon } from "./icons";
import { ProductImage } from "./ProductImage";
import { ImageLightbox } from "./ImageLightbox";
import { useMbaStatus } from "../hooks/useMbaStatus";

interface Props {
  product: Product;
  coords: { lat: number; long: number };
  onClose: () => void;
}

type StockTier = "out" | "low" | "high";

const LOW_STOCK_THRESHOLD = 5;

function stockTier(available: number): StockTier {
  if (available <= 0) return "out";
  if (available <= LOW_STOCK_THRESHOLD) return "low";
  return "high";
}

const TIER_STYLES: Record<StockTier, { text: string; dot: string; label: (n: number) => string }> = {
  out: {
    text: "text-[var(--color-muted)]",
    dot: "bg-[var(--color-muted)]",
    label: () => "Agotado",
  },
  low: {
    text: "text-[var(--color-warning)]",
    dot: "bg-[var(--color-warning)]",
    label: (n) => `${n} disp. · pocas unidades`,
  },
  high: {
    text: "text-[var(--color-accent-strong)]",
    dot: "bg-[var(--color-accent-strong)]",
    label: (n) => `${n} disp.`,
  },
};

export function ProductDetailSheet({ product, coords, onClose }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageSrc = product.imagenes[0];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Esta es la ÚNICA consulta de stock: se dispara solo al abrir el detalle
  // de un producto puntual, nunca para todo el catálogo.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["product-detail", product.product_code, coords.lat, coords.long],
    queryFn: async () => {
      const { data } = await api.get<ProductDetailResponse>(
        `/catalog/${encodeURIComponent(product.product_code)}`,
        { params: coords },
      );
      return data;
    },
    staleTime: 30_000,
  });

  const stock: StockEntry[] = useMemo(
    () => [...(data?.product?.stock ?? [])].sort((a, b) => b.available - a.available),
    [data],
  );
  const totalAvailable = stock.reduce((sum, s) => sum + s.available, 0);

  // Antes de mostrar el stock en vivo, se verifica si MBA esta activo (el
  // estado se hace polling en el backend, ver useMbaStatus). Si esta
  // caido, la API igual responde con el stock local descargado como
  // respaldo -- se avisa para que quede claro que puede no ser en vivo.
  const { data: mbaStatus } = useMbaStatus();
  const mbaDown = mbaStatus?.status === "disconnected";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-ink)]/45 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="sheet-pop-in flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[var(--radius-xl)] bg-[var(--color-surface)] shadow-[var(--shadow-pop)] sm:max-h-[85vh] sm:rounded-[var(--radius-xl)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="pr-4 text-base font-bold text-[var(--color-ink)]">{product.nombre}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-sunken)] text-[var(--color-ink-soft)] transition hover:bg-[var(--color-border)]"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        <div className="overflow-y-auto overflow-x-hidden p-5">
          <div className="flex items-center gap-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] p-4">
            {imageSrc ? (
              <button
                onClick={() => setLightboxOpen(true)}
                aria-label="Ver imagen en grande"
                className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] ring-1 ring-[var(--color-border)]"
              >
                <ProductImage src={imageSrc} alt={product.nombre} padding="p-2" iconSize={16} />
                <span className="absolute inset-0 flex items-center justify-center bg-[var(--color-ink)]/0 text-white opacity-0 transition group-hover:bg-[var(--color-ink)]/40 group-hover:opacity-100">
                  <ExpandIcon width={18} height={18} />
                </span>
              </button>
            ) : (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] ring-1 ring-[var(--color-border)]">
                <ProductImage src={imageSrc} alt={product.nombre} padding="p-2" iconSize={16} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              {product.descripcion && (
                <p className="truncate text-sm text-[var(--color-body)]">{product.descripcion}</p>
              )}
              <p className="font-display text-2xl font-extrabold text-[var(--color-brand)]">
                ${product.precio_formateado}
              </p>
            </div>

            <span className="chip shrink-0 bg-[var(--color-surface)] font-mono text-[var(--color-ink-soft)] ring-1 ring-[var(--color-border)]">
              {product.codigo}
            </span>
          </div>

          {mbaDown && (
            <div className="mt-6 flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-warning-soft)] px-3.5 py-2.5 text-xs text-[var(--color-warning)]">
              <AlertIcon width={15} height={15} className="mt-0.5 shrink-0" />
              <span>
                El servicio de stock en tiempo real (MBA) no está disponible: los números que ves
                pueden ser de la última sincronización, no en vivo.
              </span>
            </div>
          )}

          <div className={`flex flex-wrap items-center justify-between gap-2 ${mbaDown ? "mt-3" : "mt-6"}`}>
            <h3 className="text-sm font-bold text-[var(--color-ink)]">Stock por bodega</h3>
            {!isLoading && !isError && stock.length > 0 && (
              <span className="chip shrink-0 bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]">
                <BoxIcon width={13} height={13} />
                {totalAvailable} en total
              </span>
            )}
          </div>

          {isLoading && (
            <div className="mt-3 flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)]" />
              ))}
            </div>
          )}

          {isError && (
            <p className="mt-3 flex items-center gap-2 text-sm text-[var(--color-danger)]">
              <AlertIcon width={16} height={16} />
              No pudimos consultar el stock de este producto.
            </p>
          )}

          {data && !isLoading && !isError && (
            <>
              {stock.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--color-muted)]">{data.message}</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {stock.map((s) => {
                    const tier = stockTier(s.available);
                    const style = TIER_STYLES[tier];
                    return (
                      <li
                        key={s.warehouse_id}
                        className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] px-4 py-3 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-2 font-semibold text-[var(--color-ink)]">
                          <BuildingIcon width={16} height={16} className="shrink-0 text-[var(--color-muted)]" />
                          <span className="truncate">{s.friendly_name}</span>
                        </span>
                        <span className={`flex shrink-0 items-center gap-1.5 font-display font-extrabold ${style.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {style.label(s.available)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {lightboxOpen && imageSrc && (
        <ImageLightbox src={imageSrc} alt={product.nombre} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
