import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";

export default function Titlebar() {
    const appWindow = getCurrentWindow();

    const minimize = () => {
        appWindow.minimize().catch(console.error);
    };
    const toggleMaximize = () => {
        appWindow.toggleMaximize().catch(console.error);
    };
    const close = () => {
        appWindow.close().catch((e) => alert("Error menutup window: " + e));
    };

    return (
        <div className="h-9 w-full bg-slate-900 flex items-center fixed top-0 left-0 right-0 z-[100] select-none border-b border-white/5">
            {/* Logo Apps & Nama (Kiri) - bisa di drag */}
            <div
                data-tauri-drag-region
                className="pl-4 flex items-center gap-2 h-full cursor-default"
            >
                {/* Kamu bisa ganti logo masjid ini nanti */}
                <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center pointer-events-none">
                    <div className="w-2 h-2 bg-slate-900 rounded-sm" />
                </div>
                <span className="text-xs font-bold text-slate-300 tracking-wider pointer-events-none">
                    IMARAH DESKTOP
                </span>
            </div>

            {/* Area Kosong (Tengah) - berfungsi sebagai handle utama untuk menggeser window */}
            <div data-tauri-drag-region className="flex-1 h-full cursor-default" />

            {/* Tombol Aksi (Kanan) - tidak boleh ada atribut drag */}
            <div className="flex items-center h-full">
                <button
                    onClick={minimize}
                    className="h-full px-4 inline-flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <button
                    onClick={toggleMaximize}
                    className="h-full px-4 inline-flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                    <Square className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={close}
                    className="h-full px-4 inline-flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
