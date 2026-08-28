// Las bodegas de Novisuite vienen nombradas como "{negocio} - {ubicación}"
// (ej. "Importadora Novoa - Fortin", "ENV Tech - Fortin"). Para mostrar
// "dónde estoy" (ej. en el header) solo interesa la ubicación compartida,
// no el nombre de cada negocio -- eso ya se desglosa en el detalle de
// stock y en la pantalla de info del kiosko.
export function warehouseLocation(friendlyName: string): string {
  const idx = friendlyName.lastIndexOf(" - ");
  return idx >= 0 ? friendlyName.slice(idx + 3).trim() : friendlyName.trim();
}

/** Ubicación(es) única(s) entre varias bodegas, unidas si difieren. */
export function summarizeLocations(friendlyNames: string[]): string | undefined {
  const unique = Array.from(new Set(friendlyNames.map(warehouseLocation).filter(Boolean)));
  return unique.length > 0 ? unique.join(" / ") : undefined;
}
