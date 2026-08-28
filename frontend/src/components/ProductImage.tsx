import { useEffect, useState } from "react";
import { ImageOffIcon } from "./icons";
import { getAutoCroppedSquare } from "../lib/autoCropImage";

interface Props {
  src: string | undefined;
  alt: string;
  padding?: string;
  iconSize?: number;
}

/**
 * Imagen de producto con marco consistente:
 * - Si no hay URL, o la URL falla al cargar, muestra siempre el mismo
 *   placeholder (nunca el icono roto nativo del navegador).
 * - Si carga, se recorta/centra automaticamente (autoCropImage) para que
 *   el producto ocupe siempre una proporcion similar del cuadro, sin
 *   importar cuanto espacio en blanco traiga la foto original. Mientras
 *   se calcula el recorte (o si falla, ej. por CORS del host de la
 *   imagen) se muestra la imagen original con object-contain como
 *   respaldo, nunca se rompe la carga.
 *
 * IMPORTANTE: el <img> se posiciona con `absolute inset-0` (el padre debe
 * ser `relative`, ver ProductCard/ProductDetailSheet). Con solo
 * `h-full w-full` un <img> cuyo alto/ancho natural es muy distinto al del
 * cuadro (ej. un telefono recortado alto y angosto) puede hacer que el
 * navegador use su tamano intrinseco para resolver el layout del cuadro
 * `aspect-square`, agrandando la tarjeta entera. Al sacarlo del flujo con
 * `absolute`, su tamano intrinseco nunca puede afectar al contenedor.
 */
export function ProductImage({ src, alt, padding = "p-5", iconSize = 28 }: Props) {
  const [failed, setFailed] = useState(false);
  const [croppedSrc, setCroppedSrc] = useState<string | null>(null);

  useEffect(() => {
    setCroppedSrc(null);
    setFailed(false);
    if (!src) return;

    let cancelled = false;
    getAutoCroppedSquare(src)
      .then((dataUrl) => {
        if (!cancelled) setCroppedSrc(dataUrl);
      })
      .catch(() => {
        // Recorte no disponible (CORS del host u otro motivo): se sigue
        // mostrando la imagen original tal cual, sin romper nada.
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  const showPlaceholder = !src || failed;
  const displaySrc = croppedSrc ?? src;
  const showPadding = !showPlaceholder && !croppedSrc;

  if (showPlaceholder) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[var(--color-muted)]">
        <ImageOffIcon width={iconSize} height={iconSize} />
        <span className="text-[10px] font-semibold uppercase tracking-wide">Sin imagen</span>
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${showPadding ? padding : ""}`}>
      <img
        src={displaySrc}
        alt={alt}
        className="h-full w-full object-contain"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
