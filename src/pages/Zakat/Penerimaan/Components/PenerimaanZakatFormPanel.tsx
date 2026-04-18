import { ChevronLeft, Calculator } from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePenerimaanMutation } from "@/hooks/api/useZakat";
import { useNetwork } from "@/hooks/useNetwork";
import api from "@/lib/api";
import FormActions from "@/components/FormActions";
import InputLabel from "@/components/InputLabel";
import TextInput from "@/components/TextInput";
import InputError from "@/components/InputError";
import CustomSelect from "@/components/CustomSelect";
import { invoke } from "@tauri-apps/api/core";

interface MuzakkiShort {
    id: string;
    name: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    muzakkis: MuzakkiShort[];
}

export default function PenerimaanZakatFormPanel({ isOpen, onClose, muzakkis }: Props) {
    const isOnline = useNetwork();
    const { store } = usePenerimaanMutation();

    const [data, setDataForm] = useState({
        type: "fitrah" as "fitrah" | "maal",
        muzakki_contact_id: "",
        effective_date: new Date().toISOString().split('T')[0],
        payment_channel_id: "1", // Default to 'tunai' ID (usually 1)
        jiwa: "1",
        nominal_per_jiwa: "45000",
        amount: "",
        notes: "",
    });

    const [paymentChannels, setPaymentChannels] = useState<{value: string, label: string}[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);

    const setData = (key: string, value: any) => setDataForm(prev => ({ ...prev, [key]: value }));

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            setProcessing(false);
            setCalculatedAmount(null);
            // In a real app, we'd fetch payment channels from an API
            // For now, let's assume standard IDs
            setPaymentChannels([
                { value: "1", label: "Tunai" },
                { value: "2", label: "Transfer" },
                { value: "3", label: "QRIS" },
            ]);
        }
    }, [isOpen]);

    const handleCalculate = async () => {
        setCalculating(true);
        try {
            const res = await api.post("/zakat/kalkulator", {
                type: data.type,
                amount: data.type === 'maal' ? data.amount : undefined,
                jiwa: data.type === 'fitrah' ? data.jiwa : undefined,
                nominal_per_jiwa: data.type === 'fitrah' ? data.nominal_per_jiwa : undefined,
            });
            setCalculatedAmount(res.data.amount);
            if (data.type === 'fitrah') {
                setData("amount", res.data.amount);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCalculating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const payload: any = {
                type: data.type,
                contact_id: data.muzakki_contact_id,
                effective_date: data.effective_date,
                payment_channel_id: data.payment_channel_id,
            };

            if (data.notes && data.notes.trim() !== '') {
                payload.notes = data.notes;
            }

            if (data.type === 'fitrah') {
                payload.jiwa = Number(data.jiwa);
                payload.nominal_per_jiwa = Number(data.nominal_per_jiwa);
            } else {
                payload.amount = Number(data.amount);
            }

            await store.mutateAsync(payload);
            onClose();
        } catch (error: any) {
            const errData = error?.response?.data;
            if (errData?.errors) {
                const newErrors: Record<string, string> = {};
                Object.entries(errData.errors).forEach(([key, msgs]) => {
                    newErrors[key] = (msgs as string[])[0];
                });
                setErrors(newErrors);
            } else {
                setErrors({ form: errData?.message ?? "Gagal menyimpan data." });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 top-9 bg-slate-900/30 backdrop-blur-[2px] z-40" onClick={onClose}></motion.div>
                    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.3, ease: "easeOut" }} className="fixed top-12 right-0 bottom-4 bg-white w-140 shadow-2xl flex flex-col z-50 rounded-tl-2xl rounded-bl-2xl border-l border-slate-200">
                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-4 shrink-0 bg-white z-10 rounded-tl-2xl">
                            <button onClick={onClose} className="p-2 text-slate-500 transition-colors bg-slate-100 rounded-full hover:text-slate-800 hover:bg-slate-200"><ChevronLeft className="w-5 h-5" /></button>
                            <h3 className="text-lg font-bold text-slate-900">Catat Penerimaan Zakat</h3>
                        </div>

                        <div className="flex-1 min-h-0 p-5 overflow-y-auto bg-white sm:p-6 pb-safe">
                            <form id="zakat-receipt-form" onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <InputLabel value="Jenis Zakat *" />
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <button type="button" onClick={() => setData("type", "fitrah")} className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${data.type === 'fitrah' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Zakat Fitrah</button>
                                        <button type="button" onClick={() => setData("type", "maal")} className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${data.type === 'maal' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Zakat Maal</button>
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="muzakki_contact_id" value="Nama Muzakki *" />
                                    <div className="mt-1">
                                        <CustomSelect
                                            value={data.muzakki_contact_id}
                                            onChange={(val) => setData("muzakki_contact_id", val)}
                                            options={[
                                                { value: "", label: "-- Pilih Muzakki --" },
                                                ...muzakkis.map(m => ({ value: m.id, label: m.name }))
                                            ]}
                                        />
                                    </div>
                                    <InputError message={errors.muzakki_contact_id} className="mt-2" />
                                </div>

                                {data.type === 'fitrah' ? (
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <InputLabel value="Jumlah Jiwa *" />
                                            <TextInput type="number" value={data.jiwa} onChange={(e) => setData("jiwa", e.target.value)} className="w-full mt-1" />
                                        </div>
                                        <div>
                                            <InputLabel value="Harga Beras/Jiwa *" />
                                            <TextInput type="number" value={data.nominal_per_jiwa} onChange={(e) => setData("nominal_per_jiwa", e.target.value)} className="w-full mt-1" />
                                        </div>
                                        <div className="col-span-2 pt-2 border-t border-slate-200 mt-2 flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-500">Total Zakat Fitrah:</span>
                                            <span className="text-lg font-bold text-emerald-600">
                                                Rp {(Number(data.jiwa) * Number(data.nominal_per_jiwa)).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                        <div>
                                            <InputLabel value="Harta / Basis Zakat Maal *" />
                                            <div className="relative mt-1">
                                                <TextInput type="number" value={data.amount} onChange={(e) => setData("amount", e.target.value)} className="w-full pr-12" placeholder="Masukkan total harta..." />
                                                <button type="button" onClick={handleCalculate} disabled={calculating || !data.amount} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50">
                                                    <Calculator className={`w-5 h-5 ${calculating ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>
                                        </div>
                                        {calculatedAmount !== null && (
                                            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-500">Zakat Maal (2.5%):</span>
                                                <span className="text-lg font-bold text-emerald-600">
                                                    Rp {calculatedAmount.toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel value="Tanggal Terima *" />
                                        <TextInput type="date" value={data.effective_date} onChange={(e) => setData("effective_date", e.target.value)} className="w-full mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel value="Metode Pembayaran *" />
                                        <div className="mt-1">
                                            <CustomSelect value={data.payment_channel_id} onChange={(val) => setData("payment_channel_id", val)} options={paymentChannels} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <InputLabel value="Catatan Tambahan" />
                                    <textarea value={data.notes} onChange={(e) => setData("notes", e.target.value)} className="block w-full mt-1 border-slate-200 rounded-xl text-sm focus:ring-emerald-500 focus:border-emerald-500" rows={3} placeholder="Opsional..."></textarea>
                                </div>

                                {errors.form && <InputError message={errors.form} className="mt-2" />}
                            </form>
                        </div>
                        <div className="p-5 bg-white border-t border-slate-100 sm:p-6 shrink-0 pb-safe rounded-bl-2xl">
                            <FormActions onCancel={onClose} processing={processing} submitDisabled={!isOnline || !data.muzakki_contact_id} layout="full-width" submitText="Simpan Penerimaan" formId="zakat-receipt-form" />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
