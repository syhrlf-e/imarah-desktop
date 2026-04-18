import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";

export default function Titlebar() {
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const { user } = useAuth();

  const minimize = () => {
    getCurrentWindow().minimize().catch(console.error);
  };
  const toggleMaximize = () => {
    getCurrentWindow().toggleMaximize().catch(console.error);
  };
  const handleClose = () => {
    if (user) {
      setIsCloseDialogOpen(true);
    } else {
      confirmClose();
    }
  };
  const confirmClose = () => {
    getCurrentWindow().close().catch((e) => alert("Error menutup window: " + e));
  };

  return (
    <>
      <div className="h-[44px] w-full bg-white flex items-center fixed top-0 left-0 right-0 z-[100] select-none border-b border-slate-100 shadow-[0_1px_2px_rgb(0,0,0,0.01)]">
        {/* Drag Region - Left side with Logo */}
        <div
          data-tauri-drag-region
          className="pl-5 flex items-center gap-3 h-full flex-1 cursor-default"
        >
          <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center pointer-events-none shadow-sm shadow-emerald-500/20">
            <div className="w-2 h-2 bg-white rounded-[1px]" />
          </div>
          <span className="text-[13px] font-bold text-slate-800 tracking-tight pointer-events-none">
            Imarah
          </span>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <span className="text-[11px] font-medium text-slate-400 pointer-events-none">
             Sistem Manajemen Masjid
          </span>
        </div>

        {/* Drag Region - Middle Spacer */}
        <div data-tauri-drag-region className="flex-1 h-full cursor-default" />

        {/* Window Controls */}
        <div className="flex items-center h-full pr-1">
          <button
            onClick={minimize}
            className="h-8 w-11 inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg transition-colors mx-0.5"
            title="Minimize"
          >
            <Minus size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={toggleMaximize}
            className="h-8 w-11 inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg transition-colors mx-0.5"
            title="Maximize"
          >
            <Square size={13} strokeWidth={2.5} />
          </button>
          <button
            onClick={handleClose}
            className="h-8 w-11 inline-flex items-center justify-center text-slate-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors mx-0.5"
            title="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isCloseDialogOpen}
        onClose={() => setIsCloseDialogOpen(false)}
        onConfirm={confirmClose}
        title="Tutup Aplikasi?"
        variant="danger"
      >
        Apakah Anda yakin ingin menutup aplikasi Imarah Desktop? Data yang sedang diproses mungkin tidak tersimpan.
      </ConfirmDialog>
    </>
  );
}
