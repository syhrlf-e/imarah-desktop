import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  token?: string;
  expiresIn?: number;
}

type Status = "waiting" | "approved" | "rejected" | "expired";

export default function LoginWaiting({ token = "", expiresIn = 45 }: Props) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("waiting");
  const [secondsLeft, setSecondsLeft] = useState(expiresIn);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Polling status setiap 2 detik dengan AbortController
  useEffect(() => {
    if (status !== "waiting") return;

    let controller = new AbortController();

    const poll = async () => {
      try {
        const res = await fetch(`/login/challenge/${token}/status`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (data.status === "approved") {
          setStatus("approved");
          // Navigasi full ke finalize agar server bisa set session cookie HP B
          // router.visit() tidak bisa dipakai karena HP B belum punya sesi
          setTimeout(() => {
            window.location.href = `/login/challenge/${token}/finalize`;
          }, 1500);
        } else if (data.status === "rejected") {
          setStatus("rejected");
        } else if (data.status === "expired") {
          setStatus("expired");
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return; // Fetch di-abort — normal, abaikan
        // Network error lain — polling akan coba lagi
      }
    };

    // Panggil langsung pertama kali
    poll();

    pollingRef.current = setInterval(() => {
      controller.abort(); // Cancel request sebelumnya
      controller = new AbortController(); // Buat controller baru
      poll();
    }, 2000);

    return () => {
      clearInterval(pollingRef.current!);
      controller.abort(); // Cancel request saat unmount
    };
  }, [token, status]);

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
