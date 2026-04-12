import { Dialog, DialogPanel } from "@headlessui/react";
import { PropsWithChildren, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Modal({
    children,
    show = false,
    maxWidth = "2xl",
    closeable = true,
    position = "center",
    onClose = () => {},
}: PropsWithChildren<{
    show: boolean;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
    closeable?: boolean;
    position?: "center" | "bottom";
    onClose: CallableFunction;
}>) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-lg",
        xl: "sm:max-w-xl",
        "2xl": "sm:max-w-2xl",
    }[maxWidth];



    return (
        <AnimatePresence>
            {show && (
                <Dialog
                    static
                    open={show}
                    as="div"
                    id="modal"
                    className={`fixed inset-0 z-[100] flex transform transition-all ${
                        position === "bottom"
                            ? "items-end sm:items-center overflow-hidden sm:overflow-y-auto sm:px-0 sm:py-6"
                            : "items-center overflow-y-auto px-4 py-6 sm:px-0"
                    }`}
                    onClose={close}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    <DialogPanel
                        as={motion.div}
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            transition: { type: "spring", bounce: 0, duration: 0.4 },
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.95,
                            y: 16,
                            transition: { type: "spring", bounce: 0, duration: 0.4 },
                        }}
                        className={`relative bg-white shadow-xl transition-all flex flex-col overflow-hidden sm:mx-auto sm:w-full ${maxWidthClass} ${
                            position === "bottom"
                                ? "w-full rounded-t-3xl mt-auto h-[95vh] sm:rounded-lg sm:mb-6 sm:transform sm:h-auto sm:max-h-[80vh]"
                                : "mb-6 transform rounded-lg max-h-[95vh] sm:max-h-[90vh]"
                        }`}
                    >
                        {children}
                    </DialogPanel>
                </Dialog>
            )}
        </AnimatePresence>
    );
}
