import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "@/lib/auth/authStorage";

interface RequireAdminProps {
  children: ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const location = useLocation();
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/clima" replace />;
  }

  return <>{children}</>;
}
