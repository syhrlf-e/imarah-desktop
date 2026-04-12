import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Layout/Sidebar";
import TopHeader from "@/components/Layout/TopHeader";
import LoginChallengeModal from "@/components/LoginChallengeModal";
import { useLoginChallenge } from "@/hooks/useLoginChallenge";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

interface Props {
  title?: string;
  children: React.ReactNode;
}

export default function AppLayout({ title, children }: Props) {
  const { user, logout } = useAuth();

  const auth = {
    user: {
      id: user?.id ?? 0,
      name: user?.name ?? "Memuat...",
      email: user?.email ?? "",
      role: user?.role ?? "super_admin",
    },
  };
  const location = useLocation();
  const url = location.pathname;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isKickedOut, setIsKickedOut] = useState(false);

  // Login Challenge: Deteksi jika ada user lain yang mencoba login via WebSocket
  const userId = String(auth?.user?.id ?? "");
  const { activeChallenge, handleReject, handleApprove, clearChallenge } =
    useLoginChallenge(userId);

  // Toast state untuk rejection
  const [showRejectedToast, setShowRejectedToast] = useState(false);

  const handleRejectWithToast = async (token: string) => {
    await handleReject(token);
    setShowRejectedToast(true);
    setTimeout(() => setShowRejectedToast(false), 3000);
  };

  // Ambil direction statis dari SessionStorage yang diset oleh BottomNav Tap Item
  const getDirection = () => {
    if (typeof window !== "undefined") {
      const storedDir = sessionStorage.getItem("swipeDirection");
      return storedDir ? parseInt(storedDir) : 0;
    }
    return 0;
  };

  const direction = getDirection();

  // Heartbeat Polling: Cek apakah akun masih aktif / belum dihapus admin
  useEffect(() => {
    const interval = setInterval(() => {
      api
        .get("/session-heartbeat", {
          headers: { "X-Silent-Ping": "true" },
        })
        .catch((err: any) => {
          if (
            err.response &&
            (err.response.status === 401 || err.response.status === 403)
          ) {
            setIsKickedOut(true);
          }
        });
    }, 120000); // 2 Menit sekali

    return () => clearInterval(interval);
  }, []);

  // Native Desktop Logic: Intercept Window Close untuk logout aman
  useEffect(() => {
    let unlistenFn: (() => void) | undefined;
    
    const setupCloseHook = async () => {
        try {
            // Kita bypass SSR import dengan dinamis
            const { getCurrentWindow } = await import('@tauri-apps/api/window');
            const unlisten = await getCurrentWindow().onCloseRequested(async (event) => {
                const isAuth = auth?.user?.id && auth.user.id !== 0;
                if (isAuth) {
                    event.preventDefault(); // Batalkan penutupan jendela asli (prevent force kill)
                    try {
                        await api.post('/auth/logout'); // Kirim signal logout ke backend secara native
                    } catch (e) {
                        console.error('Logout signal API gagal, memotong lokal.');
                    }
                    // Setelah berurusan dengan API, baru kita matikan paksa process Tauri
                    getCurrentWindow().destroy(); 
                }
            });
            unlistenFn = unlisten;
        } catch (e) {
            console.warn("Bukan di environment Tauri, close handler diabaikan.");
        }
    };

    setupCloseHook();

    return () => {
        if (unlistenFn) unlistenFn();
    };
  }, [auth?.user?.id]);

  // Handle scroll for glassmorphism header effect on mobile
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const mobileVariants = {
    initial: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0.5,
    }),
    animate: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      // Exit halaman lama geser -30% agar terasa natural seperti native app
      x: dir > 0 ? "-30%" : "30%",
      opacity: 0,
    }),
  };

  const desktopVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div className="h-screen bg-slate-50 font-sans flex text-slate-900 overflow-hidden text-sm">

      {/* Login Reject Toast */}
      <AnimatePresence>
        {showRejectedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[200]
                                   bg-slate-900 text-white text-sm font-medium
                                   px-4 py-2 rounded-full shadow-lg"
          >
            ✕ Permintaan login telah ditolak
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Challenge Modal */}
      <AnimatePresence>
        {activeChallenge && (
          <LoginChallengeModal
            challenge={activeChallenge}
            onReject={() => handleRejectWithToast(activeChallenge.token)}
            onApprove={() => handleApprove(activeChallenge.token)}
            onExpired={clearChallenge}
          />
        )}
      </AnimatePresence>

      {/* PWA Window Controls Overlay - Drag Region */}
      <div className="pwa-titlebar-drag"></div>
      <Sidebar
        auth={auth}
        url={url}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative bg-slate-50">
        <TopHeader auth={auth} title={title} toggleSidebar={toggleSidebar} />

        <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 pt-2 pb-28 p-6 scrollbar-default relative flex flex-col">
          <AnimatePresence
            custom={direction}
            mode="popLayout"
            onExitComplete={() => sessionStorage.setItem("swipeDirection", "0")}
          >
            <motion.div
              key={url.split("?")[0]}
              custom={direction}
              variants={desktopVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                duration: 0.1,
                ease: "linear",
              }}
              className="w-full flex-1 flex flex-col min-h-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
