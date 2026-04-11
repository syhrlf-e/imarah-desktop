import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";

function App() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-8 bg-background">
      {/* Glow Effect di Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-masjid/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-masjid/20 border border-masjid/30 mb-4">
          <span className="text-4xl">🕌</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-white">
            IMARAH <span className="text-masjid">DESKTOP</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-md mx-auto">
            Sistem Manajemen Masjid Modern bertenaga Tailwind v4 & Tauri.
          </p>
        </div>

        <div className="flex gap-4 justify-center mt-8">
          <button className="px-8 py-3 bg-masjid hover:bg-emerald-400 text-slate-900 font-bold rounded-2xl transition-all shadow-lg shadow-masjid/20 active:scale-95">
            Buka Dashboard
          </button>
          <button className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all">
            Pengaturan
          </button>
        </div>
      </div>

      <footer className="absolute bottom-8 text-slate-600 text-sm font-mono">
        v2.0.0-alpha • Connected to imarah-backend.test
      </footer>
    </div>
  );
}

export default App;
