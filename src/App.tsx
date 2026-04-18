import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import React from "react";

// ── Auth Pages ────────────────────────────────────────────────
import Login from "@/pages/Auth/Login";
import LoginWaiting from "@/pages/Auth/LoginWaiting";

// ── App Pages ─────────────────────────────────────────────────
import Dashboard from "@/pages/Dashboard";
import KasIndex from "@/pages/Kas/Index";
import AgendaIndex from "@/pages/Agenda/Index";
import LaporanIndex from "@/pages/Laporan/Index";
import InventarisIndex from "@/pages/Inventaris/Index";
import SettingsIndex from "@/pages/Settings/Index";
import UserManagementIndex from "@/pages/UserManagement/Index";

// ── Profile ───────────────────────────────────────────────────
import ProfileEdit from "@/pages/Profile/Edit";

// ── Zakat ─────────────────────────────────────────────────────
import MuzakkiIndex from "@/pages/Zakat/Muzakki/Index";
import MustahiqIndex from "@/pages/Zakat/Mustahiq/Index";
import PenerimaanIndex from "@/pages/Zakat/Penerimaan/Index";
import PenyaluranIndex from "@/pages/Zakat/Penyaluran/Index";

// ── Tromol ────────────────────────────────────────────────────
import TromolIndex from "@/pages/Tromol/Index";
import TromolHistory from "@/pages/Tromol/History";
import TromolInput from "@/pages/Tromol/Input";

// ── Error & Fallbacks ───────────────────────────────────────
import ErrorPage from "@/pages/Error";

import Titlebar from "@/components/Titlebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/Toast";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RequireAuth, RequireRole } from "@/components/AuthGuards";

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Titlebar />
            <div className="pt-[44px] h-dvh w-screen box-border overflow-hidden bg-slate-50">
              <Routes>
                {/* ── Guest routes ── */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/login/waiting" element={<LoginWaiting />} />

                {/* ── Protected routes (authenticated only) ── */}
                <Route element={<RequireAuth />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<ProfileEdit />} />

                  {/* Zakat & Agenda - super_admin, bendahara, petugas_zakat */}
                  <Route
                    element={
                      <RequireRole
                        roles={["super_admin", "bendahara", "petugas_zakat"]}
                      />
                    }
                  >
                    <Route path="/agenda" element={<AgendaIndex />} />
                    <Route path="/zakat/muzakki" element={<MuzakkiIndex />} />
                    <Route path="/zakat/mustahiq" element={<MustahiqIndex />} />
                    <Route
                      path="/zakat/penerimaan"
                      element={<PenerimaanIndex />}
                    />
                    <Route
                      path="/zakat/penyaluran"
                      element={<PenyaluranIndex />}
                    />
                    <Route path="/tromol" element={<TromolIndex />} />
                    <Route path="/tromol/history" element={<TromolHistory />} />
                    <Route path="/tromol/input" element={<TromolInput />} />
                  </Route>

                  {/* Kas - super_admin, bendahara */}
                  <Route
                    element={
                      <RequireRole roles={["super_admin", "bendahara"]} />
                    }
                  >
                    <Route path="/kas" element={<KasIndex />} />
                    <Route path="/laporan" element={<LaporanIndex />} />
                  </Route>

                  {/* Inventaris - super_admin, sekretaris */}
                  <Route
                    element={
                      <RequireRole roles={["super_admin", "sekretaris"]} />
                    }
                  >
                    <Route path="/inventaris" element={<InventarisIndex />} />
                  </Route>

                  {/* Super Admin only */}
                  <Route element={<RequireRole roles={["super_admin"]} />}>
                    <Route path="/settings" element={<SettingsIndex />} />
                    <Route
                      path="/user-management"
                      element={<UserManagementIndex />}
                    />
                  </Route>
                </Route>

                {/* ── Catch-all ── */}
                <Route path="*" element={<ErrorPage />} />
              </Routes>
            </div>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
