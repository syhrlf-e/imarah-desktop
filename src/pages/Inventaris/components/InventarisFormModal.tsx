import React, { useState, useEffect } from "react";
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

interface InventarisFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingItem: InventoryItem | null;
}

export default function InventarisFormModal({ isOpen, onClose, editingItem }: InventarisFormModalProps) {
    const { store, update } = useInventarisMutation();
    const [data, setDataForm] = useState({
        item_name: "",
        quantity: "" as number | string,
        condition: "baik" as "baik" | "rusak_ringan" | "rusak_berat",
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
                    quantity: editingItem.quantity,
                    condition: editingItem.condition,
                    location: editingItem.location || "",
                    notes: editingItem.notes || "",
                });
            } else {
                setDataForm({
                    item_name: "",
                    quantity: "",
                    condition: "baik",
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">
                        {editingItem ? "Edit Data Barang" : "Catat Inventaris"}
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

                <form onSubmit={handleSubmit} className="px-6 py-5">
                    {errors.submit && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                            {errors.submit}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-1">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Kode Barang
                                </label>
                                <input
                                    type="text"
                                    value={data.item_code}
                                    onChange={(e) => {
                                        const sanitized = e.target.value.replace(/[<>()[\]{}]/g, "");
                                        setData("item_code", sanitized);
                                    }}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm shadow-sm"
                                    placeholder="Contoh: INV-001"
                                />
                                {errors.item_code && <p className="text-red-500 text-xs mt-1">{errors.item_code}</p>}
                            </div>
                            <div className="sm:col-span-2">
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
                    </div>

                    <div className="mt-6">
                        <FormActions
                            onCancel={onClose}
                            processing={processing}
                            layout="full-width"
                            submitText="Simpan Data"
                            loadingText="Memproses..."
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
