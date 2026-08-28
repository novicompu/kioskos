import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/client";
import { MailIcon, LockIcon } from "../components/icons";
import { BrandMark } from "../components/BrandMark";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "No pudimos iniciar sesión. Verifica tus datos."));
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
          <h1 className="text-xl font-extrabold text-[var(--color-ink)]">Iniciar sesión</h1>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <label className="field">
              <MailIcon width={18} height={18} />
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="field">
              <LockIcon width={18} height={18} />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && (
              <p className="rounded-[var(--radius-sm)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
              {submitting ? "Ingresando…" : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              to="/forgot-password"
              className="font-semibold text-[var(--color-brand)] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
