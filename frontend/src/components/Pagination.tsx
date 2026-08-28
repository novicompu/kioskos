import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1.5 pb-10 pt-4" aria-label="Paginación">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-sunken)] disabled:opacity-30"
        aria-label="Página anterior"
      >
        <ChevronLeftIcon width={17} height={17} />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-[var(--color-muted)]">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-sm)] px-2 text-sm font-semibold transition ${
              p === page
                ? "bg-[var(--color-brand)] text-white"
                : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunken)]"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-sunken)] disabled:opacity-30"
        aria-label="Página siguiente"
      >
        <ChevronRightIcon width={17} height={17} />
      </button>
    </nav>
  );
}

function pageWindow(page: number, total: number): (number | "…")[] {
  const span = 1;
  const items = new Set<number>([1, total]);
  for (let p = page - span; p <= page + span; p++) {
    if (p > 1 && p < total) items.add(p);
  }
  const sorted = Array.from(items).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
    result.push(sorted[i]);
  }
  return result;
}
