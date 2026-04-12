import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useKasMutation } from "@/hooks/api/useKas";
import { useNetwork } from "@/hooks/useNetwork";
import CustomSelect from "@/components/CustomSelect";
import RupiahInput from "@/components/RupiahInput";
import FormActions from "@/components/FormActions";

const CATEGORY_OPTIONS = [
    { value: "zakat_fitrah", label: "Zakat Fitrah" },
    { value: "zakat_maal", label: "Zakat Maal" },
    { value: "infaq", label: "Infaq / Sedekah" },
    { value: "infaq_tromol", label: "Infaq Tromol" },
    { value: "operasional", label: "Operasional" },
    { value: "gaji", label: "Gaji" },
    { value: "lainnya", label: "Lainnya" },
];

interface KasFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function KasFormModal({ isOpen, onClose }: KasFormModalProps) {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const isOnline = useNetwork();
    const { store } = useKasMutation();

    const [formData, setFormDataForm] = useState({
        type: "in" as "in" | "out",
        category: "infaq",
        amount: 0,
        payment_method: "tunai",
        notes: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormDataForm({ type: "in", category: "infaq", amount: 0, payment_method: "tunai", notes: "" });
            setErrors({});
            setProcessing(false);
        }
    }, [isOpen]);

    const setFormData = (key: string, value: any) => setFormDataForm(prev => ({ ...prev, [key]: value }));
    const setError = (key: string, msg: string) => setErrors(prev => ({ ...prev, [key]: msg }));
    const clearErrors = (...keys: string[]) => setErrors(prev => {
        const next = { ...prev };
        keys.length ? keys.forEach(k => delete next[k]) : Object.keys(next).forEach(k => delete next[k]);
        return next;
    });

    const handleAmountChange = (numberVal: number) => {
        setFormData("amount", numberVal);
        if (numberVal > 999999999) {
            setError("amount", "Nominal maks Rp. 999.999.999");
        } else {
            clearErrors("amount");
        }
    };

    const submitAdd = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.amount <= 0) {
            setError("amount", "Nominal harus lebih dari 0");
            return;
        }

        setProcessing(true);
        try {
            await store.mutateAsync({
                type: formData.type,
                category: formData.category,
                amount: formData.amount,
                payment_method: formData.payment_method,
                notes: formData.notes,
            });
            onClose();
        } catch (error: any) {
            const errData = error?.response?.data;
            if (errData?.errors) {
                Object.entries(errData.errors).forEach(([key, msgs]) =>
                    setError(key, (msgs as string[])[0])
                );
            } else {
                setError("amount", errData?.message ?? "Gagal menyimpan transaksi.");
            }
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
            ></motion.div>

            <motion.div
                initial={
                    isMobile
                        ? { y: "100%", opacity: 0 }
                        : { opacity: 0, scale: 0.95, y: 16 }
                }
                animate={
                    isMobile
                        ? { y: 0, opacity: 1 }
                        : { opacity: 1, scale: 1, y: 0 }
                }
                exit={
                    isMobile
                        ? { y: "100%", opacity: 0 }
                        : { opacity: 0, scale: 0.95, y: 16 }
                }
                transition={{
                    type: "spring",
                    bounce: 0,
                    duration: 0.4,
                }}
                className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[95vh] sm:h-auto sm:max-h-[80vh]"
            >
                <div className="px-5 sm:px-6 py-4 pt-8 sm:pt-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                    <h3 className="text-lg font-bold text-slate-900">
                        Catat Transaksi
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-5 sm:p-6 pb-safe flex-1 overflow-y-auto bg-white min-h-0">
                    <form id="kas-form" onSubmit={submitAdd} className="space-y-4 sm:space-y-5">
                        {/* Type Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Jenis Transaksi *
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData("type", "in")}
                                    className={`py-2.5 px-4 rounded-xl border text-sm font-medium flex items-center justify-center transition-all ${formData.type === "in" ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                                >
                                    Pemasukan (+In)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData("type", "out")}
                                    className={`py-2.5 px-4 rounded-xl border text-sm font-medium flex items-center justify-center transition-all ${formData.type === "out" ? "bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                                >
                                    Pengeluaran (-Out)
                                </button>
                            </div>
                            {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type}</p>}
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Kategori *
                            </label>
                            <CustomSelect
                                value={formData.category}
                                onChange={(val) => setFormData("category", val)}
                                options={CATEGORY_OPTIONS}
                            />
                            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                        </div>

                        {/* Amount */}
                        <div>
                            <label className={`block text-sm font-semibold mb-1.5 ${errors.amount ? "text-red-500" : "text-slate-700"}`}>
                                Nominal (Rp) *
                            </label>
                            <RupiahInput
                                value={formData.amount}
                                onValueChange={handleAmountChange}
                                isError={!!errors.amount}
                            />
                            <div className="flex justify-between items-start mt-1">
                                {errors.amount ? (
                                    <p className="text-xs text-red-500">{errors.amount}</p>
                                ) : (
                                    <div></div>
                                )}
                                <p className={`text-xs font-medium ${errors.amount ? "text-red-500" : "text-slate-400"}`}>
                                    *maks Rp. 999.999.999
                                </p>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Metode Pembayaran
                            </label>
                            <CustomSelect
                                value={formData.payment_method}
                                onChange={(val) => setFormData("payment_method", val)}
                                options={[
                                    { value: "tunai", label: "Tunai" },
                                    { value: "transfer", label: "Transfer Bank" },
                                    { value: "qris", label: "QRIS" },
                                ]}
                            />
                            {errors.payment_method && <p className="mt-1 text-xs text-red-500">{errors.payment_method}</p>}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Keterangan *
                            </label>
                            <textarea
                                required
                                value={formData.notes}
                                onChange={(e) => {
                                    const sanitizedValue = e.target.value.replace(/[<>()[\]{}]/g, "");
                                    setFormData("notes", sanitizedValue);
                                }}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm shadow-sm resize-none"
                                rows={3}
                                placeholder="Contoh: Infaq Hamba Allah, Bayar Listrik Bulan Juni"
                            ></textarea>
                            {errors.notes && <p className="mt-1 text-xs text-red-500">{errors.notes}</p>}
                        </div>
                    </form>
                </div>
                <div className="p-5 sm:p-6 border-t border-slate-100 shrink-0 bg-white pb-safe">
                    <FormActions
                        onCancel={onClose}
                        processing={processing}
                        submitDisabled={!isOnline}
                        layout="full-width"
                        submitText="Simpan Transaksi"
                        formId="kas-form"
                    />
                </div>
            </motion.div>
        </div>
    );
}
