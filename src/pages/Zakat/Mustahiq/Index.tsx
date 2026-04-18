import React, { useState, useEffect, useCallback, useRef } from "react";
import AppLayout from "@/layouts/AppLayout";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useAuth } from "@/contexts/AuthContext";
import { useMustahiqData, useMustahiqMutation } from "@/hooks/api/useZakat";
import {
    Plus,
    Edit2,
    Trash2,
    HandHeart,
    ArrowUpDown,
    SlidersHorizontal,
    ChevronLeft,
    ChevronRight,
    Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FilterBar from "@/components/FilterBar";
import PageHeader from "@/components/PageHeader";
import { useDate } from "@/hooks/useDate";
import MustahiqFormPanel from "./Components/MustahiqFormPanel";
import ConfirmDialog from "@/components/ConfirmDialog";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "@/components/Toast";
import { queryClient } from "@/lib/queryClient";

interface Mustahiq {
    id: string;
    name: string;
    ashnaf: string;
    address: string | null;
    description: string | null;
    created_at?: string;
}

const EMPTY_DATA = { data: [], meta: { current_page: 1, last_page: 1, total: 0 } };

export default function MustahiqIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("search") ?? "";
    const sortOrder = searchParams.get("order") ?? "terbaru";
    const sortAlpha = searchParams.get("sort") ?? "a-z";
    const page = searchParams.get("page") ?? "1";

    const { data: mustahiqsRes, isLoading } = useMustahiqData(searchParams.toString());
    const { remove } = useMustahiqMutation();

    const mustahiqData = mustahiqsRes || EMPTY_DATA;
    const mustahiqItems: Mustahiq[] = mustahiqData.data || [];
    const meta = mustahiqData.meta;

    const { user } = useAuth();
    const canCreate = ["super_admin", "bendahara", "petugas_zakat"].includes(user?.role ?? "");

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMustahiq, setEditingMustahiq] = useState<Mustahiq | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localSearch, setLocalSearch] = useState(search);

    const { masehiDateStr, hijriDate } = useDate();

    const applyFilters = useCallback(
        (params: { search?: string; sort?: string; order?: string; page?: string }) => {
            const nextParams = new URLSearchParams(searchParams);
            if (params.search !== undefined) nextParams.set("search", params.search);
            if (params.sort !== undefined) nextParams.set("sort", params.sort);
            if (params.order !== undefined) nextParams.set("order", params.order);
            if (params.page !== undefined) nextParams.set("page", params.page);
            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams],
    );

    const handleSearchChange = (val: string) => {
        setLocalSearch(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            applyFilters({ search: val, page: "1" });
        }, 500);
    };

    const handlePageNav = (direction: 1 | -1) => {
        const nextPage = parseInt(page as string) + direction;
        if (nextPage >= 1 && nextPage <= meta.last_page) {
             applyFilters({ page: nextPage.toString() });
        }
    };

    const handleCreate = () => {
        setEditingMustahiq(null);
        setIsFormOpen(true);
    };

    const handleEdit = (mustahiq: Mustahiq) => {
        setEditingMustahiq(mustahiq);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => setConfirmDeleteId(id);
    
    const confirmDelete = async () => {
        if (confirmDeleteId) {
            await remove.mutateAsync(confirmDeleteId);
            setConfirmDeleteId(null);
        }
    };

    const handleImportNative = async () => {
        setImporting(true);
        try {
            await invoke("import_mustahiq");
            toast.success("Data Mustahiq berhasil diimport!");
            queryClient.invalidateQueries({ queryKey: ["zakat_mustahiqs"] });
            queryClient.invalidateQueries({ queryKey: ["zakat_penyalurans"] });
        } catch (error: any) {
            if (error !== "Import dibatalkan") {
                toast.error(error.toString());
            }
        } finally {
            setImporting(false);
        }
    };

    return (
        <AppLayout title="Pengelola Zakat">
            <PageHeader
                title="Data Mustahiq"
                description="Kelola direktori penerima manfaat zakat, infaq, dan shodaqoh."
            >
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{masehiDateStr}</p>
                    <p className="text-xs text-slate-500 mt-1">{hijriDate}</p>
                </div>
            </PageHeader>

            <FilterBar
                searchPlaceholder="Cari nama atau kategori..."
                searchValue={localSearch}
                onSearchChange={handleSearchChange}
            >
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => applyFilters({ sort: sortAlpha === "a-z" ? "z-a" : "a-z", page: "1" })}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
                        {sortAlpha === "a-z" ? "A-Z" : "Z-A"}
                    </button>
                    <button
                        type="button"
                        onClick={() => applyFilters({ order: sortOrder === "terbaru" ? "terlama" : "terbaru", page: "1" })}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <SlidersHorizontal className="w-4 h-4 mr-2 text-slate-400" />
                        {sortOrder === "terbaru" ? "Terbaru" : "Terlama"}
                    </button>

                    {canCreate && (
                        <>
                            <div className="h-6 w-px bg-slate-200 mx-1" />
                            <button
                                onClick={handleImportNative}
                                disabled={importing}
                                className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4 mr-2 text-slate-400" />
                                {importing ? "Mengimport..." : "Import Excel"}
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-sm shadow-sm flex items-center justify-center cursor-pointer"
                            >
                                Daftarkan Mustahiq
                            </button>
                        </>
                    )}
                </div>
            </FilterBar>

            {isLoading ? (
                <div className="flex-1 min-h-[400px] flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-200">
                     <span className="text-slate-400">Loading...</span>
                </div>
            ) : (
                <div className="flex-1 min-h-[400px] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-auto flex-1">
                        <table className="min-w-full text-sm text-left align-middle">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-20">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Nama Mustahiq</th>
                                    <th scope="col" className="px-6 py-4">Kategori Ashnaf</th>
                                    <th scope="col" className="px-6 py-4 text-center">Tanggungan</th>
                                    <th scope="col" className="px-6 py-4">Alamat</th>
                                    <th scope="col" className="px-6 py-4">Keterangan</th>
                                    <th scope="col" className="px-6 py-4 text-right pr-6">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80">
                                {mustahiqItems.length > 0 ? (
                                    mustahiqItems.map((mustahiq) => (
                                        <tr key={mustahiq.id} className="bg-white hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-slate-800">{mustahiq.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                                                    {mustahiq.ashnaf?.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-slate-600">
                                                {/* Note: Backend needs to provide dependents count if available for Mustahiq as well, or just show '-' */}
                                                -
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 max-w-xs">
                                                <div className="truncate" title={mustahiq.address || ""}>
                                                    {mustahiq.address || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs italic max-w-xs">
                                                <div className="truncate" title={mustahiq.description || ""}>
                                                    {mustahiq.description || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(mustahiq)}
                                                        className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit Data"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(mustahiq.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus Data"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-12">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                    <HandHeart className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 mb-1">Belum ada data mustahiq</h3>
                                                <p className="text-sm text-slate-500 max-w-sm mb-6">
                                                    Daftar penerima zakat masih kosong. Tambahkan mustahiq baru untuk mulai mencatat penyaluran zakat.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-row items-center justify-between gap-3 mt-2 shrink-0">
                <span className="text-sm text-slate-500">
                    <span className="font-semibold text-slate-800">{meta.total}</span> data{" · Halaman "}
                    <span className="font-semibold text-slate-800">{meta.current_page}</span> dari{" "}
                    <span className="font-semibold text-slate-800">{meta.last_page}</span>
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

            <MustahiqFormPanel isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} mustahiq={editingMustahiq} />
            <ConfirmDialog isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} onConfirm={confirmDelete} title="Hapus Mustahiq?" variant="danger">
                Apakah Anda yakin ingin menghapus data ini? Data transaksi terkait tidak akan dihapus permanen.
            </ConfirmDialog>
        </AppLayout>
    );
}
