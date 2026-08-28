/**
 * Normaliza un valor de texto opcional: null/undefined y strings vacios
 * o solo-espacios se consideran igual de "sin dato" (null). Util para
 * campos opcionales de APIs externas que pueden venir ausentes o como
 * string vacio segun el caso, en vez de simplemente omitir la clave.
 */
export function nonBlank(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
