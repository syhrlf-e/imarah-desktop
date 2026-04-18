import React, { useState, useEffect, useCallback, useRef } from "react";
import AppLayout from "@/layouts/AppLayout";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { 
    Plus, 
    Trash2, 
    ArrowUpDown,
    SlidersHorizontal,
    ChevronLeft,
    ChevronRight,
    HandHeart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePenyaluranData, usePenyaluranMutation } from "@/hooks/api/useZakat";
import { useDate } from "@/hooks/useDate";
import { formatRupiah } from "@/utils/formatter";
import PageHeader from "@/components/PageHeader";
import FilterBar from "@/components/FilterBar";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import PenyaluranZakatFormPanel from "./Components/PenyaluranZakatFormPanel";
import { toast } from "@/components/Toast";

interface Transaction {
    id: string;
    transaction_no: string;
    effective_date: string;
    mustahiq_name: string;
    category: string;
    amount: number;
    notes: string | null;
    status: string;
}

const EMPTY_DATA = { data: [], meta: { current_page: 1, last_page: 1, total: 0 }, mustahiqs: [] };

export default function ZakatPenyaluranIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("search") ?? "";
    const sortOrder = searchParams.get("order") ?? "desc";
    const page = searchParams.get("page") ?? "1";

    const { data: zakatRes, isLoading } = usePenyaluranData(searchParams.toString());
    const { remove } = usePenyaluranMutation();
    
    const zakatData = zakatRes || EMPTY_DATA;
    const transactions: Transaction[] = zakatData.data || [];
    const meta = zakatData.meta;
    const mustahiqs = zakatData.mustahiqs || [];

    const { masehiDateStr, hijriDate } = useDate();

    const [localSearch, setLocalSearch] = useState(search);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const applyFilters = useCallback(
        (params: { search?: string; order?: string; page?: string }) => {
            const nextParams = new URLSearchParams(searchParams);
            if (params.search !== undefined) nextParams.set("search", params.search);
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

    const handleSort = () => {
        const nextOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        applyFilters({ order: nextOrder, page: "1" });
    };

    const handleCreate = () => setIsFormOpen(true);
    const handleDelete = (id: string) => setConfirmDeleteId(id);
    const confirmDelete = async () => {
        if (confirmDeleteId) {
            await remove.mutateAsync(confirmDeleteId);
            setConfirmDeleteId(null);
        }
    };

    return (
        <AppLayout title="Penyaluran Zakat">
            <PageHeader
                title="Penyaluran Zakat"
                description="Riwayat penyaluran zakat kepada mustahiq yang terdaftar."
            >
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{masehiDateStr}</p>
                    <p className="text-xs text-slate-500 mt-1">{hijriDate}</p>
                </div>
            </PageHeader>

            <FilterBar
                searchPlaceholder="Cari mustahiq atau nomor transaksi..."
                searchValue={localSearch}
                onSearchChange={handleSearchChange}
            >
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleSort}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
                        {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
                    </button>
                    
                    <button 
                        onClick={handleCreate}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-sm shadow-sm flex items-center justify-center cursor-pointer ml-2"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Salurkan Zakat
                    </button>
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
                                    <th scope="col" className="px-6 py-4">Waktu & Transaksi</th>
                                    <th scope="col" className="px-6 py-4">Nama Mustahiq</th>
                                    <th scope="col" className="px-6 py-4">Jenis Zakat</th>
                                    <th scope="col" className="px-6 py-4 text-right">Nominal</th>
                                    <th scope="col" className="px-6 py-4 text-right pr-6">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80">
                                {transactions.length > 0 ? (
                                    transactions.map((trx) => (
                                        <tr key={trx.id} className="bg-white hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-700">
                                                        {dayjs(trx.effective_date).format('DD MMM YYYY')}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                        {trx.transaction_no}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-slate-800">{trx.mustahiq_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                    trx.category === 'zakat_fitrah' 
                                                    ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                }`}>
                                                    {trx.category === 'zakat_fitrah' ? 'Zakat Fitrah' : 'Zakat Maal'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-red-600">
                                                {formatRupiah(trx.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleDelete(trx.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus Catatan"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-12">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                    <HandHeart className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 mb-1">Belum ada riwayat penyaluran</h3>
                                                <p className="text-sm text-slate-500 max-w-sm mb-6">
                                                    Catatan penyaluran zakat masih kosong. Mulai salurkan zakat kepada mustahiq di sini.
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

            <PenyaluranZakatFormPanel 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                mustahiqs={mustahiqs}
            />

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={confirmDelete}
                title="Hapus Penyaluran Zakat?"
                variant="danger"
            >
                Apakah Anda yakin ingin menghapus catatan penyaluran zakat ini? Saldo kas terkait akan ikut menyesuaikan.
            </ConfirmDialog>
        </AppLayout>
    );
}
