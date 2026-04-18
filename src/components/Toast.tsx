import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
    description?: string;
}

// Simple event emitter for toast
type Listener = (toast: Omit<ToastMessage, "id">) => void;
let listeners: Listener[] = [];

export const toast = {
    success: (message: string, description?: string) => emitToast("success", message, description),
    error: (message: string, description?: string) => emitToast("error", message, description),
    warning: (message: string, description?: string) => emitToast("warning", message, description),
    info: (message: string, description?: string) => emitToast("info", message, description),
};

const emitToast = (type: ToastType, message: string, description?: string) => {
    const newToast = { type, message, description };
    listeners.forEach((listener) => listener(newToast));
};

export const Toaster = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const handleToast = (newToast: Omit<ToastMessage, "id">) => {
            const id = Math.random().toString(36).substring(2, 11);
            const toastWithId = { ...newToast, id };

            setToasts((prev) => [toastWithId, ...prev]);
            
            setTimeout(() => {
                removeToast(id);
            }, 4500);
        };

        listeners.push(handleToast);
        return () => {
            listeners = listeners.filter((l) => l !== handleToast);
        };
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <div className="fixed top-8 left-0 right-0 z-[9999] flex flex-col items-center gap-4 pointer-events-none px-4">
            <AnimatePresence mode="popLayout">
                {toasts.map((t) => (
                    <ToastItem
                        key={t.id}
                        toast={t}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

const ToastItem = ({
    toast
}: {
    toast: ToastMessage;
}) => {
    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
    };

    const themes = {
        success: "bg-white/95 border-emerald-100 shadow-emerald-500/10",
        error: "bg-white/95 border-red-100 shadow-red-500/10",
        warning: "bg-white/95 border-amber-100 shadow-amber-500/10",
        info: "bg-white/95 border-blue-100 shadow-blue-500/10",
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -40, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
            className={`
                pointer-events-auto flex items-center gap-4 px-6 py-3.5 
                rounded-[2rem] border shadow-2xl backdrop-blur-xl
                min-w-[280px] max-w-[90vw]
                ${themes[toast.type]}
            `}
        >
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-slate-50">
                {icons[toast.type]}
            </div>
            
            <div className="flex flex-col pr-2">
                <h4 className="text-[14px] font-bold text-slate-900 leading-tight">
                    {toast.message}
                </h4>
                {toast.description && (
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5 italic">
                        {toast.description}
                    </p>
                )}
            </div>
        </motion.div>
    );
};
