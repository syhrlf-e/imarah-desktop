import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    challenge: { token: string; expires_at: number };
    onReject: () => void;
    onApprove: () => void;
    onExpired: () => void;
}

export default function LoginChallengeModal({
    challenge,
    onReject,
    onApprove,
    onExpired,
}: Props) {
    const [step, setStep] = useState<"notify" | "confirm" | "leaving">(
        "notify",
    );
    const [secondsLeft, setSecondsLeft] = useState(45);

    // Countdown timer
    useEffect(() => {
        // Reset the seconds left based on the new challenge's dynamic expire date
        const diff = Math.floor(challenge.expires_at - Date.now() / 1000);
        setSecondsLeft(diff > 0 ? diff : 45);

        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Waktu habis — default TOLAK, HP A tetap aman
                    onExpired();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [challenge.expires_at, onExpired]);

    // STEP 1 — Modal notifikasi utama
    if (step === "notify") {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
                >
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                            <span className="text-2xl">🔐</span>
                        </div>
                    </div>

                    {/* Judul */}
                    <h2 className="text-lg font-bold text-slate-900 text-center mb-2">
                        Ada yang mencoba masuk!
                    </h2>

                    {/* Pesan — simpel, tanpa istilah teknis */}
                    <p className="text-sm text-slate-500 text-center mb-1">
                        Seseorang mencoba login ke akun Anda sekarang.
                    </p>
                    <p className="text-xs text-amber-600 text-center mb-6">
                        Bukan Anda? Segera tolak dan ganti password.
                    </p>

                    {/* Countdown */}
                    <p className="text-center text-xs text-slate-400 mb-4">
                        Otomatis ditolak dalam{" "}
                        <span className="font-semibold text-slate-600">
                            {secondsLeft}
                        </span>{" "}
                        detik
                    </p>

                    {/* Tombol */}
                    <div className="flex gap-3">
                        <button
                            onClick={onReject}
                            className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm
                         hover:bg-red-600 transition-colors"
                        >
                            Tolak
                        </button>
                        <button
                            onClick={() => setStep("confirm")}
                            className="flex-1 py-3 rounded-2xl bg-green-500 text-[#052e16] font-semibold text-sm
                         hover:bg-green-600 transition-colors"
                        >
                            Izinkan
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // STEP 2 — Modal konfirmasi sebelum izinkan
    if (step === "confirm") {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
                >
                    <div className="flex justify-center mb-4">
                        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                            <span className="text-2xl">⚠️</span>
                        </div>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 text-center mb-2">
                        Konfirmasi
                    </h2>

                    <p className="text-sm text-slate-500 text-center mb-6">
                        Dengan mengizinkan, Anda akan otomatis keluar dari sesi
                        ini sekarang.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep("notify")}
                            className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600
                         font-semibold text-sm hover:bg-slate-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => {
                                setStep("leaving");
                                // Delay 2 detik untuk splash screen, baru eksekusi approve
                                setTimeout(() => {
                                    onApprove();
                                }, 2000);
                            }}
                            className="flex-1 py-3 rounded-2xl bg-green-500 text-[#052e16] font-semibold
                         text-sm hover:bg-green-600 transition-colors"
                        >
                            Ya, Izinkan
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // STEP 3 — Splash screen transisi sebelum HP A logout
    if (step === "leaving") {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center text-center"
                >
                    <span className="text-5xl mb-6">👋</span>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">
                        Sesi Anda Berakhir
                    </h2>
                    <p className="text-sm text-slate-500 max-w-xs">
                        Anda telah mengizinkan perangkat lain untuk masuk.
                        Sampai jumpa!
                    </p>
                </motion.div>
            </div>
        );
    }

    return null;
}
