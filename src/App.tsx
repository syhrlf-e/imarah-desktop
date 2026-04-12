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
import ZakatIndex from "@/pages/Zakat/Index";
import MuzakkiIndex from "@/pages/Zakat/Muzakki/Index";
import MustahiqIndex from "@/pages/Zakat/Mustahiq/Index";
import PenerimaanIndex from "@/pages/Zakat/Penerimaan/Index";
import PenyaluranIndex from "@/pages/Zakat/Penyaluran/Index";

// ── Tromol ────────────────────────────────────────────────────
import TromolIndex from "@/pages/Tromol/Index";
import TromolHistory from "@/pages/Tromol/History";
import TromolInput from "@/pages/Tromol/Input";

// ── Placeholder & Error ───────────────────────────────────────
import Placeholder from "@/pages/Placeholder";
import ErrorPage from "@/pages/Error";

import Titlebar from "@/components/Titlebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// ── Error Boundary: tangkap semua crash React agar tidak white screen ──
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: "monospace", background: "#1e293b", color: "#f1f5f9", height: "100vh" }}>
          <h1 style={{ color: "#ef4444", marginBottom: 16 }}>⚠️ Aplikasi Crash</h1>
          <p style={{ color: "#94a3b8", marginBottom: 8 }}>Error:</p>
          <pre style={{ color: "#fbbf24", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ color: "#64748b", fontSize: 12, marginTop: 16, whiteSpace: "pre-wrap" }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; }}
            style={{ marginTop: 24, padding: "10px 24px", background: "#10b981", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
          >
            Reset & Kembali ke Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Titlebar />
          <div className="pt-9 h-screen w-screen overflow-hidden bg-slate-50">
            <Routes>
              {/* ── Guest routes ── */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login/waiting" element={<LoginWaiting />} />

              {/* ── Protected routes ── */}
              <Route element={<RequireAuth />}>
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Kas */}
                <Route path="/kas" element={<KasIndex />} />

                {/* Zakat */}
                <Route path="/zakat" element={<ZakatIndex />} />
                <Route path="/zakat/muzakki" element={<MuzakkiIndex />} />
                <Route path="/zakat/mustahiq" element={<MustahiqIndex />} />
                <Route path="/zakat/penerimaan" element={<PenerimaanIndex />} />
                <Route path="/zakat/penyaluran" element={<PenyaluranIndex />} />

                {/* Agenda */}
                <Route path="/agenda" element={<AgendaIndex />} />

                {/* Laporan */}
                <Route path="/laporan" element={<LaporanIndex />} />

                {/* Inventaris */}
                <Route path="/inventaris" element={<InventarisIndex />} />

                {/* Tromol */}
                <Route path="/tromol" element={<TromolIndex />} />
                <Route path="/tromol/history" element={<TromolHistory />} />
                <Route path="/tromol/input" element={<TromolInput />} />

                {/* Settings & User Management */}
                <Route path="/settings" element={<SettingsIndex />} />
                <Route
                  path="/user-management"
                  element={<UserManagementIndex />}
                />

                {/* Profile */}
                <Route path="/profile" element={<ProfileEdit />} />
              </Route>

              {/* ── Catch-all ── */}
              <Route path="*" element={<ErrorPage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
