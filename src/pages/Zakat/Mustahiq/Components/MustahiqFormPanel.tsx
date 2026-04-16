import { ChevronLeft } from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMustahiqMutation } from "@/hooks/api/useZakat";
import { useNetwork } from "@/hooks/useNetwork";
import FormActions from "@/components/FormActions";
import InputLabel from "@/components/InputLabel";
import TextInput from "@/components/TextInput";
import InputError from "@/components/InputError";
import CustomSelect from "@/components/CustomSelect";

interface Mustahiq {
    id: string;
    name: string;
    category: string;
    phone: string | null;
    address: string | null;
    created_at?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    mustahiq?: Mustahiq | null;
}

const CATEGORIES = [
    { value: "Fakir", label: "Fakir" },
    { value: "Miskin", label: "Miskin" },
    { value: "Amil", label: "Amil" },
    { value: "Mualaf", label: "Mualaf" },
    { value: "Riqab", label: "Riqab (Hamba Sahaya)" },
    { value: "Gharimin", label: "Gharimin (Berhutang)" },
    { value: "Fisabilillah", label: "Fisabilillah" },
    { value: "Ibnu Sabil", label: "Ibnu Sabil (Musafir)" },
];

export default function MustahiqFormPanel({ isOpen, onClose, mustahiq }: Props) {
    const isOnline = useNetwork();
    const { store, update } = useMustahiqMutation(mustahiq?.id);

    const [data, setDataForm] = useState({
        name: "",
        category: "Miskin",
        phone: "",
        address: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const setData = (key: string, value: any) => setDataForm(prev => ({ ...prev, [key]: value }));

    const reset = () => setDataForm({
        name: "",
        category: "Miskin",
        phone: "",
        address: "",
    });

    useEffect(() => {
        if (isOpen) {
            clearErrors();
            setProcessing(false);
            if (mustahiq) {
                setDataForm({
                    name: mustahiq.name || "",
                    category: mustahiq.category || "Miskin",
                    phone: mustahiq.phone || "",
                    address: mustahiq.address || "",
                });
            } else {
                reset();
            }
        }
    }, [mustahiq, isOpen]);

    const clearErrors = () => setErrors({});
    const setError = (key: string, msg: string) => setErrors(prev => ({ ...prev, [key]: msg }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        clearErrors();

        try {
            const action = mustahiq ? update.mutateAsync(data) : store.mutateAsync(data);
            await action;
            onClose();
        } catch (error: any) {
            const errData = error?.response?.data;
            if (errData?.errors) {
                Object.entries(errData.errors).forEach(([key, msgs]) => {
                    setError(key, (msgs as string[])[0]);
                });
            } else {
                setError("form", errData?.message ?? "Gagal menyimpan data.");
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="fixed inset-0 top-9 bg-slate-900/30 backdrop-blur-[2px] z-40" onClick={onClose}></motion.div>
                    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.3, ease: "easeOut" }} className="fixed top-12 right-0 bottom-4 bg-white w-140 shadow-2xl flex flex-col z-50 rounded-tl-2xl rounded-bl-2xl border-l border-slate-200">
                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-4 shrink-0 bg-white z-10 rounded-tl-2xl">
                            <button onClick={onClose} className="p-2 text-slate-500 transition-colors bg-slate-100 rounded-full hover:text-slate-800 hover:bg-slate-200"><ChevronLeft className="w-5 h-5" /></button>
                            <h3 className="text-lg font-bold text-slate-900">{mustahiq ? "Edit Mustahiq" : "Daftarkan Mustahiq"}</h3>
                        </div>

                        <div className="flex-1 min-h-0 p-5 overflow-y-auto bg-white sm:p-6 pb-safe">
                            <form id="mustahiq-form" onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="name" value="Nama Lengkap *" />
                                    <TextInput id="name" value={data.name} onChange={(e) => setData("name", e.target.value)} className="block w-full mt-1" placeholder="Contoh: Budi Santoso" isFocused={isOpen} />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="category" value="Kategori Mustahiq *" />
                                    <div className="mt-1">
                                        <CustomSelect value={data.category} onChange={(val) => setData("category", val)} options={CATEGORIES} />
                                    </div>
                                    <InputError message={errors.category} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="phone" value="Nomor HP (WhatsApp)" />
                                    <TextInput id="phone" value={data.phone} onChange={(e) => setData("phone", e.target.value.replace(/\D/g, "").slice(0, 13))} className="block w-full mt-1" placeholder="0812..." />
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="address" value="Alamat" />
                                    <TextInput id="address" value={data.address} onChange={(e) => setData("address", e.target.value)} className="block w-full mt-1" placeholder="Jl. Anggrek..." />
                                    <InputError message={errors.address} className="mt-2" />
                                </div>

                                {errors.form && <InputError message={errors.form} className="mt-2" />}
                            </form>
                        </div>
                        <div className="p-5 bg-white border-t border-slate-100 sm:p-6 shrink-0 pb-safe rounded-bl-2xl">
                            <FormActions onCancel={onClose} processing={processing} submitDisabled={!isOnline} layout="full-width" submitText="Simpan Data" formId="mustahiq-form" />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
