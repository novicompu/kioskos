import { useMbaStatus } from "../hooks/useMbaStatus";

const CONFIG = {
  connected: { dot: "bg-[var(--color-accent-strong)]", label: "MBA activo" },
  disconnected: { dot: "bg-[var(--color-danger)]", label: "MBA no disponible" },
  unknown: { dot: "bg-[var(--color-muted)]", label: "Verificando MBA…" },
} as const;

/** Estado del servicio de stock en tiempo real (MBA), con polling propio. */
export function MbaStatusBadge() {
  const { data } = useMbaStatus();
  const config = CONFIG[data?.status ?? "unknown"];

  return (
    <span
      className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-[var(--color-muted)]"
      title={data?.error ? `${config.label}: ${data.error}` : config.label}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${config.dot}`} />
      <span className="hidden md:inline">{config.label}</span>
    </span>
  );
}
