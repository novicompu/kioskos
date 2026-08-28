import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { CatalogResponse, Product } from "../api/types";
import { AppHeader } from "../components/AppHeader";
import { LocationOverride } from "../components/LocationOverride";
import { Pagination } from "../components/Pagination";
import { ProductCard } from "../components/ProductCard";
import { ProductDetailSheet } from "../components/ProductDetailSheet";
import { useGeolocation } from "../hooks/useGeolocation";
import { useAppSettings } from "../hooks/useAppSettings";
import { summarizeLocations } from "../lib/warehouse";
import { SearchIcon, AlertIcon, MapPinIcon, BuildingIcon } from "../components/icons";

const PAGE_SIZE = 12;

// Los productos ENV (marca propia) siempre van primero en el catálogo.
const ENV_PATTERN = /\benv\b/i;
function isEnv(nombre: string): boolean {
  return ENV_PATTERN.test(nombre);
}

export function Catalog() {
  const { data: appSettings } = useAppSettings();
  const geo = useGeolocation(appSettings?.allowManualLocation);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const coords = geo.coords;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["catalog", coords?.lat, coords?.long],
    queryFn: async () => {
      const { data } = await api.get<CatalogResponse>("/catalog", { params: coords });
      return data;
    },
    enabled: !!coords,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!data?.products) return [];
    let list = data.products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      const envDiff = Number(isEnv(b.nombre)) - Number(isEnv(a.nombre));
      if (envDiff !== 0) return envDiff;
      return sortBy === "price" ? a.precio - b.precio : a.nombre.localeCompare(b.nombre);
    });
    return list;
  }, [data, search, sortBy]);

  // Volver a la primera página cuando cambian los filtros/orden o llega
  // catálogo nuevo (ej. cambio de ubicación).
  useEffect(() => {
    setPage(1);
  }, [search, sortBy, data]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // El nombre de cada bodega viene como "{negocio} - {ubicación}" (ej.
  // "Importadora Novoa - Fortin"); en el header solo interesa la ubicación
  // compartida, no el nombre de cada negocio (eso ya se ve desglosado en
  // el detalle de stock y en la info del kiosko).
  const kioskName = summarizeLocations((data?.warehouses ?? []).map((w) => w.friendly_name));

  return (
    <div className="page">
      <AppHeader kioskName={kioskName} />

      <main className="shell py-6 sm:py-8">
        {geo.status === "pending" && (
          <div className="flex flex-col items-center gap-3 py-24 text-center text-sm text-[var(--color-muted)]">
            <MapPinIcon width={28} height={28} className="animate-pulse text-[var(--color-brand)]" />
            Obteniendo tu ubicación…
          </div>
        )}

        {(geo.status === "denied" || geo.status === "error" || geo.status === "unsupported") && (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-warning-soft)] p-6 text-center text-sm text-[var(--color-warning)]">
            <AlertIcon width={24} height={24} />
            <p>{geo.errorMessage}</p>
            <button onClick={geo.retry} className="btn btn-primary !bg-[var(--color-warning)] shadow-none">
              Reintentar
            </button>
          </div>
        )}

        {geo.status !== "pending" && appSettings?.allowManualLocation && (
          <div className="mb-5">
            <LocationOverride
              isManual={geo.status === "manual"}
              currentCoords={coords}
              onSave={geo.setManualLocation}
              onClear={geo.clearManualLocation}
            />
          </div>
        )}

        {coords && (
          <>
            <div className="sticky top-16 z-20 -mx-4 flex flex-col gap-2 bg-[var(--color-surface-sunken)]/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
              <label className="field flex-1">
                <SearchIcon width={17} height={17} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o código…"
                />
              </label>
              <label className="field sm:w-44">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "name" | "price")}>
                  <option value="name">Ordenar: Nombre</option>
                  <option value="price">Ordenar: Precio</option>
                </select>
              </label>
            </div>

            {isLoading && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="card aspect-[3/4] animate-pulse bg-[var(--color-surface-sunken)]" />
                ))}
              </div>
            )}

            {isError && (
              <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-[var(--color-danger)]">
                <AlertIcon width={16} height={16} />
                {(error as any)?.response?.data?.message ?? "No pudimos cargar el catálogo."}
              </p>
            )}

            {data && !data.available && (
              <div className="mt-8 flex flex-col items-center gap-2 py-12 text-center">
                <BuildingIcon width={28} height={28} className="text-[var(--color-muted)]" />
                <p className="text-sm text-[var(--color-muted)]">{data.message}</p>
              </div>
            )}

            {data?.available && (
              <>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                  {paginated.map((product) => (
                    <ProductCard key={product.codigo} product={product} onSelect={setSelectedProduct} />
                  ))}
                </div>

                {filtered.length === 0 && (
                  <p className="py-16 text-center text-sm text-[var(--color-muted)]">
                    Sin resultados para tu búsqueda.
                  </p>
                )}

                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </>
            )}
          </>
        )}
      </main>

      {selectedProduct && coords && (
        <ProductDetailSheet
          product={selectedProduct}
          coords={coords}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
