import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { KiosksResponse } from "../api/types";
import { AppHeader } from "../components/AppHeader";
import { LocationOverride } from "../components/LocationOverride";
import { useAuth } from "../context/AuthContext";
import { useGeolocation } from "../hooks/useGeolocation";
import { useAppSettings } from "../hooks/useAppSettings";
import {
  ChevronLeftIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  BuildingIcon,
  FileTextIcon,
  ShieldIcon,
  UsersIcon,
  LogOutIcon,
} from "../components/icons";

const CONFIG_ITEMS = [
  { icon: UserIcon, label: "Actualizar datos", to: "/account" },
  { icon: FileTextIcon, label: "Políticas y condiciones", to: undefined },
  { icon: ShieldIcon, label: "Ley de protección de datos", to: undefined },
];

export function KioskInfo() {
  const { data: appSettings } = useAppSettings();
  const geo = useGeolocation(appSettings?.allowManualLocation);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const coords = geo.coords;

  const { data, isLoading } = useQuery({
    queryKey: ["kiosks", coords?.lat, coords?.long],
    queryFn: async () => {
      const { data } = await api.get<KiosksResponse>("/kiosks", { params: coords });
      return data;
    },
    enabled: !!coords,
  });

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="page">
      <AppHeader />

      <main className="shell max-w-3xl py-6 sm:py-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-brand)]"
        >
          <ChevronLeftIcon width={16} height={16} />
          Volver al catálogo
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <section>
            <h1 className="text-lg font-extrabold text-[var(--color-ink)]">Bodegas cercanas</h1>
            <p className="mb-3 text-sm text-[var(--color-muted)]">
              Contacto de las bodegas que abastecen tu ubicación.
            </p>

            {geo.status !== "pending" && appSettings?.allowManualLocation && (
              <div className="mb-4">
                <LocationOverride
                  isManual={geo.status === "manual"}
                  currentCoords={coords}
                  onSave={geo.setManualLocation}
                  onClear={geo.clearManualLocation}
                />
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col gap-3">
                {[0, 1].map((i) => (
                  <div key={i} className="card h-32 animate-pulse bg-[var(--color-surface-sunken)]" />
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {data?.kiosks.map((kiosk) => (
                <div key={kiosk.wareCode} className="card p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                      <BuildingIcon width={18} height={18} />
                    </div>
                    <h2 className="font-display text-sm font-bold text-[var(--color-ink)]">
                      {kiosk.displayName}
                    </h2>
                  </div>

                  <dl className="flex flex-col gap-2 text-sm">
                    {kiosk.supervisor && (
                      <div className="flex items-start gap-2.5">
                        <UserIcon width={16} height={16} className="mt-0.5 shrink-0 text-[var(--color-muted)]" />
                        <span>
                          <dt className="inline font-semibold text-[var(--color-ink)]">Supervisor: </dt>
                          <dd className="inline text-[var(--color-body)]">{kiosk.supervisor}</dd>
                        </span>
                      </div>
                    )}
                    {kiosk.address && (
                      <div className="flex items-start gap-2.5">
                        <MapPinIcon width={16} height={16} className="mt-0.5 shrink-0 text-[var(--color-muted)]" />
                        <span>
                          <dt className="inline font-semibold text-[var(--color-ink)]">Ubicación: </dt>
                          <dd className="inline text-[var(--color-body)]">{kiosk.address}</dd>
                        </span>
                      </div>
                    )}
                    {kiosk.contactName && (
                      <div className="flex items-start gap-2.5">
                        <UserIcon width={16} height={16} className="mt-0.5 shrink-0 text-[var(--color-muted)]" />
                        <span>
                          <dt className="inline font-semibold text-[var(--color-ink)]">Administrador: </dt>
                          <dd className="inline text-[var(--color-body)]">{kiosk.contactName}</dd>
                        </span>
                      </div>
                    )}
                    {kiosk.contactPhone && (
                      <div className="flex items-start gap-2.5">
                        <PhoneIcon width={16} height={16} className="mt-0.5 shrink-0 text-[var(--color-muted)]" />
                        <span>
                          <dt className="inline font-semibold text-[var(--color-ink)]">Contacto: </dt>
                          <dd className="inline text-[var(--color-body)]">{kiosk.contactPhone}</dd>
                        </span>
                      </div>
                    )}
                    {!kiosk.supervisor && !kiosk.address && !kiosk.contactName && (
                      <p className="text-[var(--color-muted)]">
                        Bodega {kiosk.wareCode} — {kiosk.friendlyName}
                      </p>
                    )}
                  </dl>
                </div>
              ))}

              {data && data.kiosks.length === 0 && (
                <p className="py-6 text-center text-sm text-[var(--color-muted)]">
                  No encontramos bodegas cercanas a tu ubicación.
                </p>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-extrabold text-[var(--color-ink)]">Configuración</h2>
            <div className="card divide-y divide-[var(--color-border)] overflow-hidden">
              {user?.role === "SUPERADMIN" && (
                <Link
                  to="/admin/users"
                  className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-sunken)]"
                >
                  <UsersIcon width={18} height={18} className="text-[var(--color-muted)]" />
                  Usuarios
                </Link>
              )}
              {CONFIG_ITEMS.map((item) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-sunken)]"
                  >
                    <item.icon width={18} height={18} className="text-[var(--color-muted)]" />
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-sunken)]"
                  >
                    <item.icon width={18} height={18} className="text-[var(--color-muted)]" />
                    {item.label}
                  </button>
                ),
              )}
            </div>

            <button onClick={handleLogout} className="btn btn-danger mt-6 w-full">
              <LogOutIcon width={17} height={17} />
              Cerrar sesión
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
