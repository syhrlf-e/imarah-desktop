import React, { useState, useEffect, useCallback, useRef } from "react";
import AppLayout from "@/layouts/AppLayout";
import api from "@/lib/api";
import { useSearchParams } from "react-router-dom";
import { PageProps } from "@/types";
import {
    Plus,
    Edit2,
    Trash2,
    Box,
    Info,
    Search,
    ChevronDown,
    Filter,
    ChevronLeft,
    ChevronRight,
    Save,
} from "lucide-react";
import FilterBar from "@/components/FilterBar";
import FormActions from "@/components/FormActions";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import DataTable, { ColumnDef } from "@/components/DataTable";
import PrimaryButton from "@/components/PrimaryButton";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "@/components/CustomSelect";
interface User {
    id: string;
    name: string;
}

interface InventoryItem {
    id: string;
    item_name: string;
    quantity: number;
    condition: "baik" | "rusak_ringan" | "rusak_berat";
    location: string | null;
    notes: string | null;
    created_at: string;
    creator?: User;
}

interface PaginationData {
    data: InventoryItem[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number;
    to: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}


const EMPTY_ITEMS: PaginationData = { data: [], current_page: 1, last_page: 1, links: [], total: 0, from: 0, to: 0, prev_page_url: null, next_page_url: null };

// Module-level cache
let inventarisCache: InventoryItem[] = [];
let inventarisCacheReady = false;

export default function InventarisIndex() {
    const [items, setItems] = useState<InventoryItem[]>(inventarisCache);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(!inventarisCacheReady);
    const [search, setSearch] = useState("");
    const [conditionFilter, setConditionFilter] = useState("semua");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

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
    const clearErrors = () => setErrors({});
    const reset = () => setDataForm({
        item_name: "",
        quantity: "" as number | string,
        condition: "baik",
        location: "",
        notes: "",
    });
    const [searchParams, setSearchParams] = useSearchParams();

    const openAddModal = () => {
        setEditingItem(null);
        reset();
        clearErrors();
        setDataForm({
            item_name: "",
            quantity: "" as number | string,
            condition: "baik",
            location: "",
            notes: "",
        });
        setIsAddOpen(true);
    };

    const openEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        setDataForm({
            item_name: item.item_name,
            quantity: item.quantity,
            condition: item.condition,
            location: item.location || "",
            notes: item.notes || "",
        });
        setIsAddOpen(true);
    };

    const closeModal = () => {
        setIsAddOpen(false);
        setTimeout(() => {
            setEditingItem(null);
            reset();
            clearErrors();
            setDataForm({
                item_name: "",
                quantity: "" as number | string,
                condition: "baik",
                location: "",
                notes: "",
            });
        }, 200);
    };

    const fetchInventaris = useCallback(async (params?: { search?: string; condition?: string }) => {
        try {
            const qp = new URLSearchParams();
            const q = params?.search ?? search;
            const cond = params?.condition ?? conditionFilter;
            if (q) qp.set('search', q);
            if (cond && cond !== 'semua') qp.set('condition', cond);
            const res = await api.get(`/inventaris?${qp.toString()}`);
            const d = res.data?.data;
            if (d?.items) {
                inventarisCache = d.items;
                inventarisCacheReady = true;
                setItems(d.items);
                setMeta({ current_page: d.meta?.current_page ?? 1, last_page: d.meta?.last_page ?? 1, total: d.meta?.total ?? 0 });
            }
        } catch (err) {
            console.error('Gagal memuat inventaris:', err);
        } finally {
            setLoading(false);
        }
    }, [search, conditionFilter]);

    useEffect(() => { fetchInventaris(); }, [fetchInventaris]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);

        if (searchTimer.current) {
            clearTimeout(searchTimer.current);
        }

        searchTimer.current = setTimeout(() => {
            fetchInventaris({ search: value });
        }, 500);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (editingItem) {
                await api.put(`/inventaris/${editingItem.id}`, data);
            } else {
                await api.post('/inventaris', data);
            }
            closeModal();
            fetchInventaris();
        } catch(error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Apakah Anda yakin ingin menghapus barang ini?")) {
            try {
                await api.delete(`/inventaris/${id}`);
                fetchInventaris();
            } catch (err) {
                console.error('Gagal hapus inventaris:', err);
            }
        }
    };

    const cleanHtmlEntities = (str: string) => {
        return str
            .replace(/&laquo;/g, "«")
            .replace(/&raquo;/g, "»")
            .replace(/&amp;/g, "&");
    };

    const conditionStyles = {
        baik: "bg-white text-emerald-600 border-emerald-300 font-medium",
        rusak_ringan: "bg-white text-amber-600 border-amber-300 font-medium",
        rusak_berat: "bg-white text-red-600 border-red-300 font-medium",
    };

    const conditionLabels = {
        baik: "Baik",
        rusak_ringan: "Rusak Ringan",
        rusak_berat: "Rusak Berat",
    };

    return (
        <AppLayout title="Pengelola Inventaris">
            {/* Header Section */}
            <PageHeader
                title="Inventaris"
                description="Daftar barang, fasilitas, dan aset yang dimiliki oleh masjid."
                className="shrink-0"
            >
                {items.length > 0 && (
                    <PrimaryButton
                        onClick={openAddModal}
                        className="!py-2.5 font-medium cursor-pointer"
                    >
                        <Plus className="w-5 h-5" />
                        Catat Inventaris
                    </PrimaryButton>
                )}
            </PageHeader>

            <FilterBar
                searchPlaceholder="Cari nama barang..."
                searchValue={search}
                onSearchChange={(val) =>
                    handleSearchChange({
                        target: { value: val },
                    } as React.ChangeEvent<HTMLInputElement>)
                }
                addon={
                    <div className="relative shrink-0 z-50">
                        {isFilterOpen && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsFilterOpen(false)}
                            ></div>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="relative z-50 inline-flex items-center justify-between w-full sm:w-[180px] px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                        >
                            <span className="flex items-center">
                                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                                <span className="truncate">
                                    {conditionFilter === "semua" ||
                                    !conditionFilter
                                        ? "Semua Kondisi"
                                        : conditionLabels[
                                              conditionFilter as keyof typeof conditionLabels
                                          ]}
                                </span>
                            </span>
                            <ChevronDown
                                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ml-2 ${isFilterOpen ? "rotate-180" : ""}`}
                            />
                        </button>
                        <AnimatePresence>
                            {isFilterOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-full sm:w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-[60] p-1"
                                >
                                    {[
                                        {
                                            value: "semua",
                                            label: "Semua Kondisi",
                                        },
                                        { value: "baik", label: "Baik" },
                                        {
                                            value: "rusak_ringan",
                                            label: "Rusak Ringan",
                                        },
                                        {
                                            value: "rusak_berat",
                                            label: "Rusak Berat",
                                        },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                setConditionFilter(opt.value);
                                                setIsFilterOpen(false);
                                                fetchInventaris({ condition: opt.value });
                                            }}
                                            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                                                (conditionFilter || "semua") ===
                                                opt.value
                                                    ? "bg-green-50 text-green-700 font-semibold"
                                                    : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                }
            />

            {/* Data Table */}
            <DataTable
                className="flex-1 min-h-[400px]"
                tableFixed
                columns={
                    [
                        {
                            key: "tanggal",
                            header: "Tanggal",
                            width: "w-[15%]",
                            cellClassName:
                                "whitespace-nowrap text-slate-600 font-medium text-sm",
                            render: (item) => (
                                <>
                                    <div>
                                        {new Date(
                                            item.created_at,
                                        ).toLocaleDateString("id-ID", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                        {new Date(
                                            item.created_at,
                                        ).toLocaleTimeString("id-ID", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </>
                            ),
                        },
                        {
                            key: "nama",
                            header: "Nama Barang",
                            width: "w-[20%]",
                            cellClassName: "whitespace-nowrap",
                            render: (item) => (
                                <span className="font-semibold text-slate-700">
                                    {item.item_name}
                                </span>
                            ),
                        },
                        {
                            key: "jumlah",
                            header: "Jumlah",
                            width: "w-[12%]",
                            headerClassName: "text-center",
                            cellClassName: "whitespace-nowrap text-center",
                            render: (item) => (
                                <span className="text-slate-700 font-medium">
                                    {item.quantity}
                                </span>
                            ),
                        },
                        {
                            key: "kondisi",
                            header: "Kondisi",
                            width: "w-[13%]",
                            cellClassName: "whitespace-nowrap",
                            render: (item) => (
                                <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs border ${conditionStyles[item.condition]}`}
                                >
                                    {conditionLabels[item.condition]}
                                </span>
                            ),
                        },
                        {
                            key: "lokasi",
                            header: "Lokasi",
                            width: "w-[15%]",
                            cellClassName:
                                "whitespace-nowrap text-slate-600 font-medium",
                            render: (item) =>
                                item.location || (
                                    <span className="text-slate-400 italic">
                                        Belum diatur
                                    </span>
                                ),
                        },
                        {
                            key: "keterangan",
                            header: "Keterangan",
                            width: "w-[15%]",
                            cellClassName: "max-w-xs truncate text-slate-600",
                            render: (item) => item.notes || "-",
                        },
                        {
                            key: "aksi",
                            header: "Aksi",
                            width: "w-[10%]",
                            headerClassName: "text-right",
                            cellClassName: "whitespace-nowrap text-right",
                            render: (item) => (
                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(item)}
                                        className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Edit Barang"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus Barang"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ),
                        },
                    ] satisfies ColumnDef<InventoryItem>[]
                }
                data={items}
                keyExtractor={(row) => row.id}
                emptyState={
                    <div className="flex flex-col items-center justify-center text-slate-400 py-12">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Info className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">
                            Belum ada data barang
                        </h3>
                        <p className="text-sm text-slate-500 max-w-sm mb-6 text-center">
                            Daftar fasilitas dan aset masjid masih kosong. Catat
                            inventaris baru untuk mulai memonitor aset.
                        </p>
                        <PrimaryButton
                            onClick={openAddModal}
                            className="inline-flex items-center justify-center !py-2.5 font-medium cursor-pointer"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Catat Inventaris
                        </PrimaryButton>
                    </div>
                }
            />

            {/* Pagination */}
            {meta.last_page > 1 && (
                <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-row items-center justify-between gap-3 mt-2 shrink-0">
                    <span className="text-sm text-slate-500">
                        <span className="font-semibold text-slate-800">
                            {meta.total}
                        </span>{" "}
                        data{" · Halaman "}
                        <span className="font-semibold text-slate-800">
                            {meta.current_page}
                        </span>{" "}
                        dari{" "}
                        <span className="font-semibold text-slate-800">
                            {meta.last_page}
                        </span>
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={meta.current_page <= 1}
                            onClick={() => fetchInventaris({ search, condition: conditionFilter })}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <AnimatePresence mode="popLayout">
                            {[
                                meta.current_page - 1,
                                meta.current_page,
                                meta.current_page + 1,
                            ]
                                .filter((p) => p >= 1 && p <= meta.last_page)
                                .map((p) => (
                                    <motion.button
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.2 }}
                                        key={p}
                                        type="button"
                                        onClick={() => {
                                            if (p === meta.current_page) return;
                                        }}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${
                                            p === meta.current_page
                                                ? "bg-green-600 text-white border-green-600 cursor-default"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        {p}
                                    </motion.button>
                                ))}
                        </AnimatePresence>

                        <button
                            type="button"
                            disabled={meta.current_page >= meta.last_page}
                            onClick={() => fetchInventaris({ search, condition: conditionFilter })}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Add/Edit */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={closeModal}
                    ></div>

                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingItem
                                    ? "Edit Data Barang"
                                    : "Catat Inventaris"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-6 py-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Nama Barang *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.item_name}
                                        onChange={(e) => {
                                            const sanitized =
                                                e.target.value.replace(
                                                    /[<>()[\]{}]/g,
                                                    "",
                                                );
                                            setData("item_name", sanitized);
                                        }}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm shadow-sm"
                                        placeholder="Misal: Kipas Angin Dinding"
                                        required
                                    />
                                    {errors.item_name && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.item_name}
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
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
                                                // Allow empty string to completely clear the input
                                                if (val === "") {
                                                    setData("quantity", "");
                                                    return;
                                                }
                                                // Parse to int to remove leading zeros, then update state
                                                const parsed = parseInt(
                                                    val,
                                                    10,
                                                );
                                                if (
                                                    !isNaN(parsed) &&
                                                    parsed >= 0
                                                ) {
                                                    setData("quantity", parsed);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm shadow-sm"
                                            required
                                        />
                                        {errors.quantity && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.quantity}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Kondisi *
                                        </label>
                                        <CustomSelect
                                            value={data.condition}
                                            onChange={(val) =>
                                                setData("condition", val as any)
                                            }
                                            options={[
                                                {
                                                    value: "baik",
                                                    label: "Baik",
                                                },
                                                {
                                                    value: "rusak_ringan",
                                                    label: "Rusak Ringan",
                                                },
                                                {
                                                    value: "rusak_berat",
                                                    label: "Rusak Berat",
                                                },
                                            ]}
                                        />
                                        {errors.condition && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.condition}
                                            </p>
                                        )}
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
                                            const sanitized =
                                                e.target.value.replace(
                                                    /[<>()[\]{}]/g,
                                                    "",
                                                );
                                            setData("location", sanitized);
                                        }}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm shadow-sm"
                                        placeholder="Misal: Gudang Belakang"
                                    />
                                    {errors.location && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.location}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Keterangan / Catatan
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => {
                                            const sanitized =
                                                e.target.value.replace(
                                                    /[<>()[\]{}]/g,
                                                    "",
                                                );
                                            setData("notes", sanitized);
                                        }}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm shadow-sm resize-none"
                                        rows={3}
                                        placeholder="Tambahkan informasi detail jika perlu..."
                                    ></textarea>
                                    {errors.notes && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.notes}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <FormActions
                                onCancel={closeModal}
                                processing={processing}
                                layout="full-width"
                                submitText="Simpan Data"
                                loadingText="Memproses..."
                            />
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
