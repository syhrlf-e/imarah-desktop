import { ChevronLeft } from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useKasMutation } from "@/hooks/api/useKas";
import { useNetwork } from "@/hooks/useNetwork";
import CustomSelect from "@/components/CustomSelect";
import RupiahInput from "@/components/RupiahInput";
import FormActions from "@/components/FormActions";

const CATEGORY_OPTIONS_IN = [
    { value: "zakat_fitrah", label: "Zakat Fitrah" },
    { value: "zakat_maal", label: "Zakat Maal" },
    { value: "infaq", label: "Infaq / Sedekah" },
    { value: "infaq_tromol", label: "Infaq Tromol" },
];

const CATEGORY_OPTIONS_OUT = [
    { value: "operasional", label: "Operasional" },
    { value: "gaji", label: "Gaji" },
    { value: "lainnya", label: "Lainnya" },
];

interface KasFormPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function KasFormPanel({ isOpen, onClose }: KasFormPanelProps) {
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

    useEffect(() => {
        if (isOpen) {
            setFormDataForm({ type: "in", category: "infaq", amount: 0, payment_method: "tunai", notes: "" });
            setErrors({});
            setProcessing(false);
        }
    }, [isOpen]);

    const setFormData = (key: string, value: any) => {
        setFormDataForm(prev => {
            const newData = { ...prev, [key]: value };
            if (key === "type") {
                newData.category = value === "in" ? "infaq" : "operasional";
            }
            return newData;
        });
    };

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
                const keyMap: Record<string, string> = {
                    direction: "type",
                    fund_id: "category",
                    expense_category_id: "category",
                    payment_channel_id: "payment_method"
                };
                Object.entries(errData.errors).forEach(([key, msgs]) => {
                    const mappedKey = keyMap[key] || key;
                    setError(mappedKey, (msgs as string[])[0]);
                });
            } else {
                setError("amount", errData?.message ?? "Gagal menyimpan transaksi.");
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed inset-0 top-[36px] h-[calc(100vh-36px)] bg-slate-900/50 backdrop-blur-sm z-40"
                        onClick={onClose}
                    ></motion.div>

                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed top-[36px] right-0 h-[calc(100vh-36px)] bg-white w-[480px] shadow-2xl flex flex-col z-50 rounded-tl-2xl rounded-bl-2xl border-l border-slate-200"
                    >
                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-4 shrink-0 bg-white z-10 rounded-tl-2xl">
                            <button
                                onClick={onClose}
                                className="text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h3 className="text-lg font-bold text-slate-900">
                                Catat Transaksi
                            </h3>
                        </div>

                        <div className="p-5 sm:p-6 pb-safe flex-1 overflow-y-auto bg-white min-h-0">
                            <form id="kas-form" onSubmit={submitAdd} className="space-y-4 sm:space-y-5">
                                {/* Form content remains the same */}
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

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Kategori *
                                    </label>
                                    <CustomSelect
                                        value={formData.category}
                                        onChange={(val) => setFormData("category", val)}
                                        options={formData.type === "in" ? CATEGORY_OPTIONS_IN : CATEGORY_OPTIONS_OUT}
                                    />
                                    {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                                </div>

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
                        <div className="p-5 sm:p-6 border-t border-slate-100 shrink-0 bg-white pb-safe rounded-bl-2xl">
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
                </>
            )}
        </AnimatePresence>
    );
}
