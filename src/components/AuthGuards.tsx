import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type GuardProps = {
  children: ReactNode;
};

type RoleGuardProps = GuardProps & {
  roles: string[];
};

function AuthLoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Memuat...</p>
      </div>
    </div>
  );
}

function GuestGuard({ children }: GuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function UserGuard({ children }: GuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function RequireAuth() {
  return (
    <UserGuard>
      <Outlet />
    </UserGuard>
  );
}

export function RequireRole({ roles }: { roles: string[] }) {
  return (
    <RoleGuard roles={roles}>
      <Outlet />
    </RoleGuard>
  );
}

export const AuthGuards = {
  GuestGuard,
  UserGuard,
  RoleGuard,
};
