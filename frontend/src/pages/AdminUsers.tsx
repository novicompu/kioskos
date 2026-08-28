import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "../api/client";
import type { ManagedUser, UsersListResponse, User, SettingsResponse } from "../api/types";
import { AppHeader } from "../components/AppHeader";
import { generatePassword } from "../lib/passwordGenerator";
import { useAppSettings } from "../hooks/useAppSettings";
import {
  ChevronLeftIcon,
  UserIcon,
  MailIcon,
  LockIcon,
  PlusIcon,
  RefreshIcon,
  CopyIcon,
  CheckCircleIcon,
  AlertIcon,
  MapPinIcon,
} from "../components/icons";

type Role = User["role"];
type Mode = "invite" | "password";

const ROLE_LABEL: Record<Role, string> = {
  USER: "Usuario",
  ADMIN: "Admin",
  SUPERADMIN: "Superadmin",
};

function RoleBadge({ role }: { role: Role }) {
  const tone =
    role === "SUPERADMIN"
      ? "bg-[var(--color-brand)] text-white"
      : role === "ADMIN"
        ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
        : "bg-[var(--color-surface-sunken)] text-[var(--color-ink-soft)]";
  return <span className={`chip ${tone}`}>{ROLE_LABEL[role]}</span>;
}

export function AdminUsers() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);

  const { data: appSettings } = useAppSettings();
  const updateSettings = useMutation({
    mutationFn: async (allowManualLocation: boolean) => {
      const { data } = await api.patch<SettingsResponse>("/admin/settings", { allowManualLocation });
      return data.settings;
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(["app-settings"], settings);
    },
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [mode, setMode] = useState<Mode>("invite");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await api.get<UsersListResponse>("/admin/users");
      return data;
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const body =
        mode === "invite"
          ? { mode, name, email, role }
          : { mode, name, email, role, password };
      const { data } = await api.post<{ status: string; user: ManagedUser; invited: boolean }>(
        "/admin/users",
        body,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSuccessMessage(
        data.invited
          ? `Se envió una invitación a ${data.user.email} para que cree su contraseña.`
          : `Usuario ${data.user.email} creado con la contraseña definida.`,
      );
      setName("");
      setEmail("");
      setPassword("");
      setRole("USER");
      setMode("invite");
      setFormOpen(false);
    },
    onError: (err) => {
      setFormError(getErrorMessage(err, "No pudimos crear el usuario."));
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (mode === "password" && password.length < 8) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    createUser.mutate();
  }

  function handleGeneratePassword() {
    setPassword(generatePassword());
    setShowPassword(true);
  }

  async function handleCopyPassword() {
    try {
      await navigator.clipboard.writeText(password);
    } catch {
      // portapapeles no disponible: no es critico, el campo sigue visible.
    }
  }

  return (
    <div className="page">
      <AppHeader />

      <main className="shell max-w-3xl py-6 sm:py-8">
        <Link
          to="/kiosk-info"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-brand)]"
        >
          <ChevronLeftIcon width={16} height={16} />
          Volver
        </Link>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold text-[var(--color-ink)]">Usuarios</h1>
            <p className="text-sm text-[var(--color-muted)]">Crea y administra las cuentas del kiosko.</p>
          </div>
          <button
            onClick={() => {
              setFormOpen((v) => !v);
              setSuccessMessage(null);
              setFormError(null);
            }}
            className="btn btn-primary"
          >
            <PlusIcon width={16} height={16} />
            Nuevo usuario
          </button>
        </div>

        <div className="card mb-6 flex items-center justify-between gap-4 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
              <MapPinIcon width={18} height={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--color-ink)]">Ubicación manual</p>
              <p className="text-xs text-[var(--color-muted)]">
                Permite fijar lat/long a mano en vez de usar el GPS del dispositivo. Útil para
                kioskos fijos o pruebas; desactívalo para exigir siempre GPS real.
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={appSettings?.allowManualLocation ?? false}
            onClick={() => updateSettings.mutate(!(appSettings?.allowManualLocation ?? false))}
            disabled={!appSettings || updateSettings.isPending}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              appSettings?.allowManualLocation ? "bg-[var(--color-brand)]" : "bg-[var(--color-border)]"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                appSettings?.allowManualLocation ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {successMessage && (
          <div className="mb-4 flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] px-4 py-3 text-sm text-[var(--color-brand-strong)]">
            <CheckCircleIcon width={17} height={17} className="mt-0.5 shrink-0" />
            {successMessage}
          </div>
        )}

        {formOpen && (
          <form onSubmit={handleSubmit} className="card mb-6 flex flex-col gap-4 p-5">
            <h2 className="text-sm font-bold text-[var(--color-ink)]">Nuevo usuario</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field">
                <UserIcon width={17} height={17} />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre completo"
                  required
                />
              </label>
              <label className="field">
                <MailIcon width={17} height={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </label>
            </div>

            <label className="field">
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="USER">Usuario</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPERADMIN">Superadmin</option>
              </select>
            </label>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-[var(--color-ink-soft)]">
                ¿Cómo obtiene su contraseña inicial?
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "invite"}
                    onChange={() => setMode("invite")}
                  />
                  Enviar invitación por correo
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "password"}
                    onChange={() => setMode("password")}
                  />
                  Definirla yo mismo
                </label>
              </div>
            </div>

            {mode === "password" && (
              <div className="flex gap-2">
                <label className="field flex-1">
                  <LockIcon width={17} height={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña inicial"
                    minLength={8}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  title="Generar contraseña"
                  className="btn btn-ghost shrink-0 !px-3"
                >
                  <RefreshIcon width={16} height={16} />
                </button>
                {password && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    title="Copiar contraseña"
                    className="btn btn-ghost shrink-0 !px-3"
                  >
                    <CopyIcon width={16} height={16} />
                  </button>
                )}
              </div>
            )}

            {formError && (
              <p className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
                <AlertIcon width={15} height={15} className="shrink-0" />
                {formError}
              </p>
            )}

            <button type="submit" disabled={createUser.isPending} className="btn btn-primary self-start">
              {createUser.isPending ? "Creando…" : "Crear usuario"}
            </button>
          </form>
        )}

        {isLoading && (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-16 animate-pulse bg-[var(--color-surface-sunken)]" />
            ))}
          </div>
        )}

        {isError && (
          <p className="flex items-center gap-2 text-sm text-[var(--color-danger)]">
            <AlertIcon width={16} height={16} />
            No pudimos cargar los usuarios.
          </p>
        )}

        {data && (
          <div className="card divide-y divide-[var(--color-border)] overflow-hidden">
            {data.users.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{u.name}</p>
                  <p className="truncate text-xs text-[var(--color-muted)]">{u.email}</p>
                </div>
                <RoleBadge role={u.role} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
