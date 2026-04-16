import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import FormActions from "@/components/FormActions";
import { useInventarisMutation } from "@/hooks/api/useInventaris";

interface InventoryItem {
    id: string;
    item_code: string | null;
    item_name: string;
    category: "aset" | "habis_pakai";
    quantity: number;
    condition: "baik" | "rusak_ringan" | "rusak_berat";
    location: string | null;
    source: "beli" | "wakaf" | "hibah";
    source_details: string | null;
    notes: string | null;
}

interface InventarisFormPanelProps {
    isOpen: boolean;
    onClose: () => void;
    editingItem: InventoryItem | null;
}

export default function InventarisFormPanel({ isOpen, onClose, editingItem }: InventarisFormPanelProps) {
    const { store, update } = useInventarisMutation();
    const [data, setDataForm] = useState({
        item_name: "",
        category: "aset" as "aset" | "habis_pakai",
        quantity: "" as number | string,
        condition: "baik" as "baik" | "rusak_ringan" | "rusak_berat",
        source: "beli" as "beli" | "wakaf" | "hibah",
        source_details: "",
        location: "",
        notes: "",
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const setData = (key: string, value: any) => setDataForm(prev => ({ ...prev, [key]: value }));

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            setProcessing(false);
            if (editingItem) {
                setDataForm({
                    item_name: editingItem.item_name,
                    category: editingItem.category,
                    quantity: editingItem.quantity,
                    condition: editingItem.condition,
                    source: editingItem.source,
                    source_details: editingItem.source_details || "",
                    location: editingItem.location || "",
                    notes: editingItem.notes || "",
                });
            } else {
                setDataForm({
                    item_name: "",
                    category: "aset",
                    quantity: "",
                    condition: "baik",
                    source: "beli",
                    source_details: "",
                    location: "",
                    notes: "",
                });
            }
        }
    }, [isOpen, editingItem]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            if (editingItem) {
                await update.mutateAsync({ id: editingItem.id, data });
            } else {
                await store.mutateAsync(data);
            }
            onClose();
        } catch (error: any) {
            const errData = error?.response?.data;
            if (errData?.errors) {
                setErrors(errData.errors);
            } else {
                setErrors({ submit: errData?.message || "Gagal menyimpan data inventaris." });
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
                        className="fixed inset-0 top-[36px] bg-slate-900/30 backdrop-blur-[2px] z-40"
                        onClick={onClose}
                    ></motion.div>

                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed top-[48px] right-0 bottom-4 bg-white w-[560px] shadow-2xl flex flex-col z-50 rounded-tl-2xl rounded-bl-2xl border-l border-slate-200"
                    >
                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-4 shrink-0 bg-white z-10 rounded-tl-2xl">
                            <button
                                onClick={onClose}
                                className="text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingItem ? "Edit Data Barang" : "Catat Inventaris"}
                            </h3>
                        </div>

                        <div className="p-5 sm:p-6 pb-safe flex-1 overflow-y-auto bg-white min-h-0">
                            <form id="inventaris-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                                {errors.submit && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                                        {errors.submit}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Nama Barang *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.item_name}
                                        onChange={(e) => {
                                            const sanitized = e.target.value.replace(/[<>()[\]{}]/g, "");
                                            setData("item_name", sanitized);
                                        }}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm shadow-sm"
                                        placeholder="Misal: Kipas Angin Dinding"
                                        required
                                    />
                                    {errors.item_name && <p className="text-red-500 text-xs mt-1">{errors.item_name}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Kategori *
                                        </label>
                                        <CustomSelect
                                            value={data.category}
                                            onChange={(val) => setData("category", val as any)}
                                            options={[
                                                { value: "aset", label: "Aset Tetap" },
                                                { value: "habis_pakai", label: "Habis Pakai" },
                                            ]}
                                        />
                                        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Kondisi *
                                        </label>
                                        <CustomSelect
                                            value={data.condition}
                                            onChange={(val) => setData("condition", val as any)}
                                            options={[
                                                { value: "baik", label: "Baik" },
                                                { value: "rusak_ringan", label: "Rusak Ringan" },
                                                { value: "rusak_berat", label: "Rusak Berat" },
                                            ]}
                                        />
                                        {errors.condition && <p className="text-red-500 text-xs mt-1">{errors.condition}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Jumlah *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.quantity}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "") {
                                                    setData("quantity", "");
                                                    return;
                                                }
                                                const parsed = parseInt(val, 10);
                                                if (!isNaN(parsed) && parsed >= 0) {
                                                    setData("quantity", parsed);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm shadow-sm"
                                            required
                                        />
                                        {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Sumber *
                                        </label>
                                        <CustomSelect
                                            value={data.source}
                                            onChange={(val) => setData("source", val as any)}
                                            options={[
                                                { value: "beli", label: "Beli / Kas" },
                                                { value: "wakaf", label: "Wakaf" },
                                                { value: "hibah", label: "Hibah / Sumbangan" },
                                            ]}
                                        />
                                        {errors.source && <p className="text-red-500 text-xs mt-1">{errors.source}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Keterangan Sumber
                                        </label>
                                        <input
                                            type="text"
                                            value={data.source_details}
                                            onChange={(e) => {
                                                const sanitized = e.target.value.replace(/[<>()[\]{}]/g, "");
                                                setData("source_details", sanitized);
                                            }}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm shadow-sm"
                                            placeholder="Misal: Bp. H. Fulan"
                                        />
                                        {errors.source_details && <p className="text-red-500 text-xs mt-1">{errors.source_details}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Lokasi Penyimpanan
                                    </label>
                                    <input
                                        type="text"
                                        value={data.location}
                                        onChange={(e) => {
                                            const sanitized = e.target.value.replace(/[<>()[\]{}]/g, "");
                                            setData("location", sanitized);

                                        }}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm shadow-sm"
                                        placeholder="Misal: Gudang Belakang"
                                    />
                                    {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Keterangan / Catatan
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => {
                                            const sanitized = e.target.value.replace(/[<>()[\]{}]/g, "");
                                            setData("notes", sanitized);
                                        }}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm shadow-sm resize-none"
                                        rows={3}
                                        placeholder="Tambahkan informasi detail jika perlu..."
                                    ></textarea>
                                    {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes}</p>}
                                </div>
                            </form>
                        </div>
                        <div className="p-5 sm:p-6 border-t border-slate-100 shrink-0 bg-white pb-safe rounded-bl-2xl">
                            <FormActions
                                onCancel={onClose}
                                processing={processing}
                                layout="full-width"
                                submitText="Simpan Data"
                                loadingText="Memproses..."
                                formId="inventaris-form"
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
