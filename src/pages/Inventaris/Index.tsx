import React, { useState, useCallback, useRef, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useInventarisData, useInventarisMutation } from "@/hooks/api/useInventaris";
import {
    Plus,
    Edit2,
    Trash2,
    Info,
    Filter,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Search,
} from "lucide-react";
import FilterBar from "@/components/FilterBar";
import PageHeader from "@/components/PageHeader";
import DataTable, { ColumnDef } from "@/components/DataTable";
import PrimaryButton from "@/components/PrimaryButton";
import { motion, AnimatePresence } from "framer-motion";
import InventarisFormPanel from "./components/InventarisFormPanel";
import ConfirmDialog from "@/components/ConfirmDialog";

interface User {
    id: string;
    name: string;
}

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
    created_at: string;
    creator?: User;
}

const EMPTY_ITEMS = { items: [], meta: { current_page: 1, last_page: 1, total: 0, from: 0, to: 0, links: [], prev_page_url: null, next_page_url: null } };

export default function InventarisIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("search") ?? "";
    const conditionFilter = searchParams.get("condition") ?? "semua";
    const page = searchParams.get("page") ?? "1";

    const { data: inventarisData, isLoading, isFetching } = useInventarisData(searchParams.toString());
    const { remove } = useInventarisMutation();

    const data = inventarisData || EMPTY_ITEMS;
    const items: InventoryItem[] = data.items || [];
    const meta = data.meta;

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localSearch, setLocalSearch] = useState(search);
    
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const applyFilters = useCallback(
        (params: { search?: string; condition?: string; page?: string }) => {
            const nextParams = new URLSearchParams(searchParams);
            if (params.search !== undefined) nextParams.set("search", params.search);
            if (params.condition !== undefined) {
                if (params.condition === "semua") {
                    nextParams.delete("condition");
                } else {
                    nextParams.set("condition", params.condition);
                }
            }
            if (params.page !== undefined) nextParams.set("page", params.page);
            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams],
    );

    const openAddModal = () => {
        setEditingItem(null);
        setIsAddOpen(true);
    };

    const openEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        setIsAddOpen(true);
    };

    const handleSearchChange = (val: string) => {
        setLocalSearch(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            applyFilters({ search: val, page: "1" });
        }, 500);
    };

    const handleConditionChange = (condition: string) => {
        setIsFilterOpen(false);
        applyFilters({ condition, page: "1" });
    };

    const handlePageNav = (direction: 1 | -1) => {
        const nextPage = parseInt(page as string) + direction;
        if (nextPage >= 1 && nextPage <= meta.last_page) {
             applyFilters({ page: nextPage.toString() });
        }
    };

    const handleDelete = (id: string) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        if (confirmDeleteId) {
            await remove.mutateAsync(confirmDeleteId);
            setConfirmDeleteId(null);
        }
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

    const [hijriDate, setHijriDate] = useState<string>("");

    const getHijriDateString = () => {
        try {
            const date = new Date();
            const format = new Intl.DateTimeFormat("id-TN-u-ca-islamic", {
                day: "numeric",
                month: "long",
                year: "numeric",
            }).format(date);
            return format.replace(/ H$/i, "") + " H";
        } catch (e) {
            return "Tanggal Hijriyah";
        }
    };

    useEffect(() => {
        setHijriDate(getHijriDateString());
    }, []);

    const masehiDateStr = dayjs().format("dddd, D MMMM YYYY");

    return (
        <AppLayout title="Pengelola Inventaris">
            {/* Header Section */}
            <PageHeader
                title="Inventaris"
                description="Daftar barang, fasilitas, dan aset yang dimiliki oleh masjid."
                className="shrink-0"
            >
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                        {masehiDateStr}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {hijriDate}
                    </p>
                </div>
            </PageHeader>

            <FilterBar
                searchPlaceholder="Cari nama barang..."
                searchValue={localSearch}
                onSearchChange={handleSearchChange}
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
                                    {conditionFilter === "semua" || !conditionFilter
                                        ? "Semua Kondisi"
                                        : conditionLabels[conditionFilter as keyof typeof conditionLabels]}
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
                                        { value: "semua", label: "Semua Kondisi" },
                                        { value: "baik", label: "Baik" },
                                        { value: "rusak_ringan", label: "Rusak Ringan" },
                                        { value: "rusak_berat", label: "Rusak Berat" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleConditionChange(opt.value)}
                                            className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                                                (conditionFilter || "semua") === opt.value
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
            >
                {/* Catat Inventaris */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={openAddModal}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-sm shadow-sm flex items-center justify-center cursor-pointer shrink-0"
                    >
                        Catat Inventaris
                    </button>
                </div>
            </FilterBar>

            {/* Data Table */}
            <DataTable
                className="flex-1 min-h-[400px]"
                loading={isLoading}
                isFetching={isFetching}
                tableFixed
                columns={
                    [
                        {
                            key: "kode_barang",
                            header: "Kode Barang",
                            width: "w-[10%]",
                            cellClassName: "whitespace-nowrap",
                            render: (item) => (
                                item.item_code ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                        {item.item_code}
                                    </span>
                                ) : (
                                    <span className="text-slate-400 italic text-xs">-</span>
                                )
                            ),
                        },
                        {
                            key: "nama",
                            header: "Nama Barang",
                            width: "w-[15%]",
                            cellClassName: "whitespace-nowrap font-bold text-slate-800",
                            render: (item) => item.item_name,
                        },
                        {
                            key: "kategori",
                            header: "Kategori",
                            width: "w-[10%]",
                            cellClassName: "whitespace-nowrap text-slate-600 capitalize",
                            render: (item) => item.category?.replace('_', ' ') || 'Aset',
                        },
                        {
                            key: "kondisi",
                            header: "Kondisi",
                            width: "w-[10%]",
                            cellClassName: "whitespace-nowrap",
                            render: (item) => (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] border ${conditionStyles[item.condition]}`}>
                                    {conditionLabels[item.condition]}
                                </span>
                            ),
                        },
                        {
                            key: "jumlah",
                            header: "Jumlah",
                            width: "w-[7%]",
                            cellClassName: "whitespace-nowrap",
                            render: (item) => (
                                <div className="font-semibold text-slate-700">{item.quantity} Unit</div>
                            ),
                        },
                        {
                            key: "lokasi",
                            header: "Penyimpanan",
                            width: "w-[13%]",
                            cellClassName: "whitespace-nowrap text-slate-600 font-medium",
                            render: (item) => item.location || <span className="text-slate-400 italic">Belum diatur</span>,
                        },
                        {
                            key: "sumber",
                            header: "Sumber",
                            width: "w-[13%]",
                            cellClassName: "whitespace-nowrap text-slate-600",
                            render: (item) => (
                                <div>
                                    <div className="font-semibold text-slate-700 capitalize">{item.source || 'Beli'}</div>
                                    {item.source_details && (
                                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[120px]" title={item.source_details}>
                                            {item.source_details}
                                        </div>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: "tanggal",
                            header: "Tanggal",
                            width: "w-[10%]",
                            cellClassName: "text-slate-600 text-sm whitespace-nowrap",
                            render: (item) => (
                                <div className="font-medium">
                                    {new Date(item.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                </div>
                            ),
                        },
                        {
                            key: "aksi",
                            header: "Aksi",
                            width: "w-[5%]",
                            headerClassName: "text-right",
                            cellClassName: "whitespace-nowrap text-right",
                            render: (item) => (
                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(item)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Barang">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Barang">
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
                    <div className="flex flex-col items-center justify-center text-slate-400 py-2">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            {localSearch || conditionFilter !== "semua" ? (
                                <Search className="w-8 h-8 text-slate-300" />
                            ) : (
                                <Info className="w-8 h-8 text-slate-300" />
                            )}
                        </div>
                        <p className="font-bold text-slate-800">
                            {localSearch || conditionFilter !== "semua" 
                                ? "Barang tidak ditemukan" 
                                : "Belum ada data barang"}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            {localSearch || conditionFilter !== "semua" 
                                ? "Kami tidak menemukan barang yang sesuai pencarian." 
                                : "Aset yang ditambahkan akan muncul di sini."}
                        </p>
                    </div>
                }
            />

            {/* Pagination Desktop - Dinamis */}
            <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-row items-center justify-between gap-3 mt-2 shrink-0">
                <span className="text-sm text-slate-500">
                    <span className="font-semibold text-slate-800">{meta.total}</span> data · Halaman <span className="font-semibold text-slate-800">{meta.current_page}</span> dari <span className="font-semibold text-slate-800">{meta.last_page}</span>
                </span>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        disabled={meta.current_page <= 1}
                        onClick={() => handlePageNav(-1)}
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <AnimatePresence mode="popLayout">
                        {[meta.current_page - 1, meta.current_page, meta.current_page + 1]
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
                                        if (p !== meta.current_page) applyFilters({ page: p.toString() });
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
                        onClick={() => handlePageNav(1)}
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <InventarisFormPanel
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                editingItem={editingItem}
            />

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={confirmDelete}
                title="Hapus Barang Inventaris?"
                variant="danger"
            >
                Apakah Anda yakin ingin menghapus data barang ini? Tindakan ini tidak dapat dibatalkan.
            </ConfirmDialog>
        </AppLayout>
    );
}
