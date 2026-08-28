import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import { MailIcon, CheckCircleIcon } from "../components/icons";
import { BrandMark } from "../components/BrandMark";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
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
          <h1 className="text-xl font-extrabold text-[var(--color-ink)]">Recuperar contraseña</h1>
          <p className="mt-1.5 text-sm text-[var(--color-muted)]">
            Ingresa tu correo y te enviaremos instrucciones para restablecerla.
          </p>

          {sent ? (
            <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--color-brand-soft)] p-4 text-sm text-[var(--color-brand-strong)]">
              <CheckCircleIcon width={20} height={20} className="mt-0.5 shrink-0" />
              <p>Si el correo existe en nuestro sistema, recibirás un enlace de recuperación en breve.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <label className="field">
                <MailIcon width={18} height={18} />
                <input
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              {error && (
                <p className="rounded-[var(--radius-sm)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className="btn btn-primary w-full">
                {submitting ? "Enviando…" : "Enviar instrucciones"}
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
