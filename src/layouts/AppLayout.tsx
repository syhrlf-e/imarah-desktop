import { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "@/components/Layout/Sidebar";
import TopHeader from "@/components/Layout/TopHeader";
import LoginChallengeHandler from "@/components/Layout/LoginChallengeHandler";
import PageTransitionWrapper from "@/components/Layout/PageTransitionWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionHeartbeat } from "@/hooks/useSessionHeartbeat";

interface Props {
  title?: string;
  children: React.ReactNode;
}

export default function AppLayout({ title, children }: Props) {
  const { user } = useAuth();
  const location = useLocation();
  const url = location.pathname;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Normalized auth object for downstream components
  const auth = {
    user: {
      id: user?.id ?? 0,
      name: user?.name ?? "Memuat...",
      email: user?.email ?? "",
      role: user?.role ?? "super_admin",
    },
  };

  const userId = String(auth.user.id);

  // ── Extracted concerns ──────────────────────────────────────
  useSessionHeartbeat();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="h-full bg-slate-50 font-sans flex items-stretch text-slate-900 overflow-hidden text-sm">

      {/* Login Challenge Handler (modal + reject toast) */}
      <LoginChallengeHandler userId={userId} />

      <Sidebar
        auth={auth}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50">
        <TopHeader auth={auth} title={title} toggleSidebar={toggleSidebar} />

        <div className="flex-1 min-h-0 overflow-x-hidden px-4 pt-2 pb-4 sm:px-6 relative flex flex-col">
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
        </div>
      </main>
    </div>
  );
}
