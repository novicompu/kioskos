import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import { LockIcon, CheckCircleIcon, AlertIcon } from "../components/icons";
import { BrandMark } from "../components/BrandMark";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>

        <div className="card p-7 sm:p-8">
          <h1 className="text-xl font-extrabold text-[var(--color-ink)]">Nueva contraseña</h1>

          {!token ? (
            <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] p-4 text-sm text-[var(--color-danger)]">
              <AlertIcon width={20} height={20} className="mt-0.5 shrink-0" />
              <p>Enlace inválido. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".</p>
            </div>
          ) : done ? (
            <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] p-4 text-sm text-[var(--color-brand-strong)]">
              <CheckCircleIcon width={20} height={20} className="mt-0.5 shrink-0" />
              <p>Contraseña actualizada. Redirigiendo a inicio de sesión…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <label className="field">
                <LockIcon width={18} height={18} />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label className="field">
                <LockIcon width={18} height={18} />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>

              {error && (
                <p className="rounded-[var(--radius-sm)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className="btn btn-primary w-full">
                {submitting ? "Guardando…" : "Guardar contraseña"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="font-semibold text-[var(--color-brand)] hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
