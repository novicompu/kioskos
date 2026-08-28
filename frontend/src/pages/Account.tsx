import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { AppHeader } from "../components/AppHeader";
import { ChevronLeftIcon, UserIcon, MailIcon, LockIcon, CheckCircleIcon } from "../components/icons";

export function Account() {
  const { user, refresh } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    setProfileError(null);
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      await api.patch("/auth/me", { name, email });
      await refresh();
      setProfileSaved(true);
    } catch (err) {
      setProfileError(getErrorMessage(err, "No pudimos actualizar tus datos."));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setSavingPassword(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(getErrorMessage(err, "No pudimos actualizar tu contraseña."));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="page">
      <AppHeader />

      <main className="shell max-w-xl py-6 sm:py-8">
        <Link
          to="/kiosk-info"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-brand)]"
        >
          <ChevronLeftIcon width={16} height={16} />
          Volver
        </Link>

        <h1 className="mb-1 text-lg font-extrabold text-[var(--color-ink)]">Actualizar datos</h1>
        <p className="mb-6 text-sm text-[var(--color-muted)]">
          Actualiza tu información personal y tu contraseña.
        </p>

        <form onSubmit={handleProfileSubmit} className="card flex flex-col gap-4 p-5">
          <h2 className="text-sm font-bold text-[var(--color-ink)]">Información personal</h2>

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

          {profileError && (
            <p className="rounded-[var(--radius-sm)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
              {profileError}
            </p>
          )}

          {profileSaved && (
            <p className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-brand-soft)] px-3 py-2 text-sm text-[var(--color-brand-strong)]">
              <CheckCircleIcon width={16} height={16} />
              Datos actualizados.
            </p>
          )}

          <button type="submit" disabled={savingProfile} className="btn btn-primary self-start">
            {savingProfile ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>

        <form onSubmit={handlePasswordSubmit} className="card mt-6 flex flex-col gap-4 p-5">
          <h2 className="text-sm font-bold text-[var(--color-ink)]">Cambiar contraseña</h2>

          <label className="field">
            <LockIcon width={17} height={17} />
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Contraseña actual"
              required
            />
          </label>

          <label className="field">
            <LockIcon width={17} height={17} />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña"
              minLength={8}
              required
            />
          </label>

          <label className="field">
            <LockIcon width={17} height={17} />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar nueva contraseña"
              minLength={8}
              required
            />
          </label>

          {passwordError && (
            <p className="rounded-[var(--radius-sm)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
              {passwordError}
            </p>
          )}

          {passwordSaved && (
            <p className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-brand-soft)] px-3 py-2 text-sm text-[var(--color-brand-strong)]">
              <CheckCircleIcon width={16} height={16} />
              Contraseña actualizada.
            </p>
          )}

          <button type="submit" disabled={savingPassword} className="btn btn-primary self-start">
            {savingPassword ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </form>
      </main>
    </div>
  );
}
