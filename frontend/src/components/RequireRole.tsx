import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { User } from "../api/types";

interface Props {
  role: User["role"];
  children: ReactNode;
}

/** Debe usarse dentro de <RequireAuth> (asume que ya hay sesión). */
export function RequireRole({ role, children }: Props) {
  const { user } = useAuth();

  if (user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
