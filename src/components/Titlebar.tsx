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
    <div className="h-9 w-full bg-white/60 backdrop-blur-md flex items-center fixed top-0 left-0 right-0 z-[100] select-none border-b border-slate-200/60 shadow-[0_1px_2px_rgb(0,0,0,0.02)]">
      <div
        data-tauri-drag-region
        className="pl-4 flex items-center gap-2 h-full cursor-default"
      >
        <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center pointer-events-none shadow-sm shadow-emerald-500/20">
          <div className="w-2 h-2 bg-white rounded-sm" />
        </div>
        <span className="text-xs font-medium text-slate-700 tracking-wider pointer-events-none">
          Imarah Desktop
        </span>
      </div>

      <div data-tauri-drag-region className="flex-1 h-full cursor-default" />

      <div className="flex items-center h-full">
        <button
          onClick={minimize}
          className="h-full px-4 inline-flex items-center justify-center text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={toggleMaximize}
          className="h-full px-4 inline-flex items-center justify-center text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 transition-colors"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={close}
          className="h-full px-4 inline-flex items-center justify-center text-slate-500 hover:bg-red-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
