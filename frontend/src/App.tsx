import { Routes, Route } from "react-router-dom";
import { RequireAuth } from "./components/RequireAuth";
import { RequireRole } from "./components/RequireRole";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Catalog } from "./pages/Catalog";
import { KioskInfo } from "./pages/KioskInfo";
import { Account } from "./pages/Account";
import { AdminUsers } from "./pages/AdminUsers";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Catalog />
          </RequireAuth>
        }
      />
      <Route
        path="/kiosk-info"
        element={
          <RequireAuth>
            <KioskInfo />
          </RequireAuth>
        }
      />
      <Route
        path="/account"
        element={
          <RequireAuth>
            <Account />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth>
            <RequireRole role="SUPERADMIN">
              <AdminUsers />
            </RequireRole>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
