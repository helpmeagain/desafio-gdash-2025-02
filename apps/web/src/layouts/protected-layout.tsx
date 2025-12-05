import * as React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCurrentUser } from "@/lib/auth/authStorage";
import { refresh } from "@/lib/auth/authApi";

type AuthStatus = "checking" | "authorized" | "unauthorized";

export function ProtectedLayout() {
  const [status, setStatus] = React.useState<AuthStatus>("checking");
  const location = useLocation();

  React.useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const user = getCurrentUser();

        if (user) {
          if (!cancelled) {
            setStatus("authorized");
          }
          return;
        }

        try {
          await refresh();
          if (!cancelled) {
            setStatus("authorized");
          }
        } catch {
          if (!cancelled) {
            setStatus("unauthorized");
          }
        }
      } catch {
        if (!cancelled) {
          setStatus("unauthorized");
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-4">
        <span className="text-sm text-muted-foreground">
          Verificando sessão
        </span>
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
