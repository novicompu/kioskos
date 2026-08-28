interface Props {
  tone?: "light" | "dark";
  size?: "sm" | "md";
}

/**
 * Marca de Novisolutions. Placeholder tipográfico hasta contar con el
 * logo oficial en SVG — reemplazar el contenido del <div> de la marca por
 * un <img>/<svg> cuando esté disponible, sin tocar los usos.
 */
export function BrandMark({ tone = "light", size = "md" }: Props) {
  const isDark = tone === "dark";
  const boxSize = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex ${boxSize} items-center justify-center rounded-[var(--radius-sm)] font-display font-extrabold`}
        style={{
          background: isDark ? "rgba(255,255,255,0.12)" : "var(--color-brand)",
          color: isDark ? "white" : "white",
        }}
      >
        NS
      </div>
      <div className="leading-none">
        <p
          className="font-display text-sm font-bold tracking-tight"
          style={{ color: isDark ? "white" : "var(--color-ink)" }}
        >
          Novisolutions
        </p>
        <p
          className="mt-0.5 text-[11px] font-medium uppercase tracking-wider"
          style={{ color: isDark ? "rgba(255,255,255,0.5)" : "var(--color-muted)" }}
        >
          Kiosko
        </p>
      </div>
    </div>
  );
}
