import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandMark } from "./BrandMark";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page flex min-h-dvh flex-col items-center justify-center gap-4">
        <BrandMark />
        <div className="h-1 w-32 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div className="h-full w-1/2 animate-[loading_1.1s_ease-in-out_infinite] rounded-full bg-[var(--color-brand)]" />
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
