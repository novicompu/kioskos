import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MenuIcon } from "./icons";
import { BrandMark } from "./BrandMark";
import { MbaStatusBadge } from "./MbaStatusBadge";

export function AppHeader({ kioskName }: { kioskName?: string }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
      <div className="shell flex h-16 items-center justify-between gap-3 sm:h-[4.5rem]">
        <BrandMark size="sm" />

        <div className="hidden text-right leading-none sm:block">
          <p className="font-display text-sm font-bold tracking-tight text-[var(--color-ink)]">
            {user?.name}
          </p>
          {kioskName && (
            <p className="mt-0.5 text-[11px] font-medium text-[var(--color-muted)]">{kioskName}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <MbaStatusBadge />

          <Link
            to="/kiosk-info"
            aria-label="Abrir menú"
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink)] transition hover:bg-[var(--color-surface-sunken)]"
          >
            <MenuIcon width={22} height={22} />
          </Link>
        </div>
      </div>
    </header>
  );
}
