import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

// Simple event emitter for toast
type Listener = (toast: Omit<ToastMessage, "id">) => void;
let listeners: Listener[] = [];

export const toast = {
    success: (message: string) => emitToast("success", message),
    error: (message: string) => emitToast("error", message),
    warning: (message: string) => emitToast("warning", message),
    info: (message: string) => emitToast("info", message),
};

const emitToast = (type: ToastType, message: string) => {
    const newToast = { type, message };
    listeners.forEach((listener) => listener(newToast));
};

export const Toaster = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const handleToast = (newToast: Omit<ToastMessage, "id">) => {
            const id = Math.random().toString(36).substr(2, 9);
            const toastWithId = { ...newToast, id };

            setToasts((prev) => [...prev, toastWithId]);
            // Auto remove after 4.5 seconds
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
        <div className="fixed bottom-0 right-0 z-[9999] p-4 sm:p-6 md:p-8 flex flex-col gap-3 pointer-events-none w-full sm:w-auto items-center sm:items-end sm:max-w-md">
            <AnimatePresence>
                {toasts.map((t) => (
                    <ToastItem
                        key={t.id}
                        toast={t}
                        onRemove={() => removeToast(t.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

const ToastItem = ({
    toast,
    onRemove,
}: {
    toast: ToastMessage;
    onRemove: () => void;
}) => {
    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
    };

    const borders = {
        success: "border-emerald-200/50 bg-white shadow-emerald-900/5",
        error: "border-red-200/50 bg-white shadow-red-900/5",
        warning: "border-amber-200/50 bg-white shadow-amber-900/5",
        info: "border-blue-200/50 bg-white shadow-blue-900/5",
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 w-full sm:w-[320px] p-4 rounded-2xl shadow-xl border ${borders[toast.type]}`}
        >
            <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-snug break-words">
                    {toast.message}
                </p>
            </div>
            <button
                onClick={onRemove}
                className="shrink-0 p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};
