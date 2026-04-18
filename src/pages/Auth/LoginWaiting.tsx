import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface Props {
  token?: string;
  expiresIn?: number;
}

type Status = "waiting" | "approved" | "rejected" | "expired";

export default function LoginWaiting({ token: propsToken = "", expiresIn = 45 }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const token = location.state?.challengeToken || propsToken;
  const [status, setStatus] = useState<Status>("waiting");
  const [secondsLeft, setSecondsLeft] = useState(expiresIn);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Security Guard: Cegah polling tanpa token
  useEffect(() => {
    if (!token) {
        navigate("/login", { replace: true });
    } else {
        // Start Rust listener
        invoke("start_challenge_listener", { token });
    }
  }, [token, navigate]);

  // Listen to Rust events
  useEffect(() => {
    const unlisten = listen<{ status: Status; token: string }>("challenge-status-changed", (event) => {
        if (event.payload.token === token) {
            const newStatus = event.payload.status;
            if (newStatus === "approved") {
                setStatus("approved");
                setTimeout(async () => {
                    try {
                        const finalizeRes = await api.post(`/auth/challenge/${token}/finalize`);
                        const finalData = finalizeRes.data;
                        if (finalData.status === 'success' && finalData.data) {
                            login(finalData.data.token, finalData.data.user);
                            navigate('/dashboard', { replace: true });
                        } else {
                            navigate('/login');
                        }
                    } catch {
                        navigate('/login');
                    }
                }, 1500);
            } else {
                setStatus(newStatus);
            }
        }
    });

    return () => {
        unlisten.then((fn) => fn());
    };
  }, [token, navigate, login]);

  const getColor = () => {
    if (secondsLeft > 20) return "#22C55E";
    if (secondsLeft > 10) return "#F59E0B";
    return "#EF4444";
  };

  // Hitung progress untuk SVG circle
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (secondsLeft / expiresIn) * circumference;

  // Countdown timer
  useEffect(() => {
    if (status !== "waiting") return;

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status]);

  // Pantau jika waktu habis, otomatis ubah status ke expired dan tendang ke login setelah jeda 3 detik
  useEffect(() => {
    if (secondsLeft <= 0 && status === "waiting") {
      setStatus("expired");
      setTimeout(() => navigate("/login"), 3000); // Otomatis kembali ke login setelah 3 detik lihat pesan
    }
  }, [secondsLeft, status, navigate]);

  // TAMPILAN WAITING — Progress bar melingkar
  if (status === "waiting") {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center px-5">
        <div className="flex flex-col items-center text-center">
          {/* Progress bar melingkar dengan SVG */}
          <div className="relative w-36 h-36 mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              {/* Track (background) */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="8"
              />
              {/* Progress */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={getColor()}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                style={{
                  transition: "stroke-dashoffset 1s linear, stroke 0.5s ease",
                }}
              />
            </svg>

            {/* Angka di tengah */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-3xl font-bold transition-colors duration-500"
                style={{ color: getColor() }}
              >
                {secondsLeft}
              </span>
              <span className="text-xs text-slate-400">detik</span>
            </div>
          </div>

          {/* Icon */}
          <span className="text-4xl mb-4">🔐</span>

          {/* Teks */}
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            Menunggu Konfirmasi
          </h2>
          <p className="text-sm text-slate-500 max-w-xs">
            Permintaan login Anda sedang dikonfirmasi oleh pengguna yang sedang
            aktif.
          </p>
        </div>
      </div>
    );
  }

  // TAMPILAN APPROVED — Splash sukses
  if (status === "approved") {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <span className="text-5xl mb-6">✅</span>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Login Berhasil!
          </h2>
          <p className="text-sm text-slate-500">
            Anda akan masuk ke dashboard sebentar lagi...
          </p>
        </motion.div>
      </div>
    );
  }

  // TAMPILAN REJECTED — Ditolak HP A
  if (status === "rejected") {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <span className="text-5xl mb-6">✕</span>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Login Ditolak
          </h2>
          <p className="text-sm text-slate-500 mb-8 max-w-xs">
            Permintaan Anda tidak diizinkan oleh pengguna yang sedang aktif.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-2xl
                       hover:bg-slate-800 transition-colors"
          >
            Kembali ke Login
          </button>
        </motion.div>
      </div>
    );
  }

  // TAMPILAN EXPIRED — Waktu habis, tidak ada respon
  if (status === "expired") {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <span className="text-5xl mb-6">⏱️</span>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Waktu Habis</h2>
          <p className="text-sm text-slate-500 mb-8 max-w-xs">
            Tidak ada konfirmasi dari pengguna yang sedang aktif. Silakan coba
            lagi nanti.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-2xl
                       hover:bg-slate-800 transition-colors"
          >
            Kembali ke Login
          </button>
        </motion.div>
      </div>
    );
  }

  return null;
}
