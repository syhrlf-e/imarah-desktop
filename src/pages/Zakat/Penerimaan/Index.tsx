import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePenerimaanData, usePenerimaanMutation } from "@/hooks/api/useZakat";
import AppLayout from "@/layouts/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import PenerimaanZakatFormPanel from "./Components/PenerimaanZakatFormPanel";
import {
    Trash2,
    ArrowUpDown,
    SlidersHorizontal,
    Plus,
} from "lucide-react";
import FilterBar from "@/components/FilterBar";
import PageHeader from "@/components/PageHeader";
import { useDate } from "@/hooks/useDate";
import DataTable, { ColumnDef } from "@/components/DataTable";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
};

interface ZakatTransaction {
    id: string;
    transaction_no: string;
    effective_date: string;
    donatur_name: string;
    category: string;
    amount: number;
    notes: string | null;
    status: string;
}

const EMPTY_PAGE = { items: [], meta: { current_page: 1, last_page: 1, total: 0 } };

export default function PenerimaanIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const canCreate = ["super_admin", "bendahara", "petugas_zakat"].includes(user?.role ?? '');

    const { data: res, isLoading } = usePenerimaanData(searchParams.toString());
    const { remove } = usePenerimaanMutation();
    
    const rootData = res?.data ?? {};
    const transactionsData = rootData.transactions ?? EMPTY_PAGE;
    const items = transactionsData.items ?? [];
    const meta = transactionsData.meta ?? EMPTY_PAGE.meta;

    const { masehiDateStr, hijriDate } = useDate();

    const [search, setSearch] = useState(searchParams.get('search') || "");
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>(searchParams.get('order') as any || 'desc');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handlePageNav = (page: number) => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('page', String(page));
        setSearchParams(nextParams, { replace: true });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            const nextParams = new URLSearchParams(searchParams);
            if (search) {
                nextParams.set('search', search);
            } else {
                nextParams.delete('search');
            }
            nextParams.set('page', '1');
            setSearchParams(nextParams, { replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleSort = () => {
        const nextOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        setSortOrder(nextOrder);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('order', nextOrder);
        setSearchParams(nextParams, { replace: true });
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
        <AppLayout title="Penerimaan Zakat">
            <div className="contents">
                <PageHeader
                    title="Penerimaan Zakat"
                    description="Catat dan kelola riwayat penerimaan zakat fitrah dan zakat maal."
                >
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{masehiDateStr}</p>
                        <p className="text-xs text-slate-500 mt-1">{hijriDate}</p>
                    </div>
                </PageHeader>

                <FilterBar
                    searchPlaceholder="Cari nomor transaksi atau nama muzakki..."
                    searchValue={search}
                    onSearchChange={setSearch}
                >
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={handleSort} className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                            <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
                            {sortOrder === "desc" ? "Terbaru" : "Terlama"}
                        </button>

                        {canCreate && (
                            <button onClick={handleCreate} className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-sm shadow-sm flex items-center justify-center cursor-pointer ml-2">
                                <Plus className="w-4 h-4 mr-2" />
                                Catat Zakat
                            </button>
                        )}
                    </div>
                </FilterBar>

                <DataTable
                    className="flex-1 min-h-0"
                    tableFixed
                    columns={
                        [
                            {
                                key: "effective_date",
                                header: "Tanggal",
                                render: (trx) => (
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-700">{trx.effective_date}</span>
                                        <span className="text-xs text-slate-400 uppercase font-semibold tracking-tighter">{trx.transaction_no}</span>
                                    </div>
                                ),
                            },
                            {
                                key: "donatur_name",
                                header: "Nama Muzakki",
                                cellClassName: "font-bold text-slate-800",
                                render: (trx) => trx.donatur_name,
                            },
                            {
                                key: "category",
                                header: "Kategori",
                                render: (trx) => (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                        trx.category === "zakat_fitrah" 
                                            ? "bg-blue-50 text-blue-700 border-blue-100" 
                                            : "bg-indigo-50 text-indigo-700 border-indigo-100"
                                    }`}>
                                        {trx.category === "zakat_fitrah" ? "Zakat Fitrah" : "Zakat Maal"}
                                    </span>
                                ),
                            },
                            {
                                key: "amount",
                                header: "Total Bayar",
                                cellClassName: "font-bold text-emerald-600",
                                render: (trx) => formatCurrency(trx.amount),
                            },
                            {
                                key: "status",
                                header: "Status",
                                render: (trx) => (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                        trx.status === "verified" 
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                            : "bg-amber-50 text-amber-700 border-amber-100"
                                    }`}>
                                        {trx.status === "verified" ? "Terverifikasi" : "Menunggu"}
                                    </span>
                                )
                            },
                            {
                                key: "actions",
                                header: "Aksi",
                                headerClassName: "text-right pr-6",
                                cellClassName: "whitespace-nowrap text-right text-sm",
                                render: (trx) => (
                                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleDelete(trx.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Data"><Trash2 size={18} /></button>
                                    </div>
                                ),
                            },
                        ] satisfies ColumnDef<ZakatTransaction>[]
                    }
                    data={items}
                    isLoading={isLoading}
                    keyExtractor={(row) => row.id}
                    emptyState={<EmptyState message={search ? "Data penerimaan tidak ditemukan." : "Belum ada riwayat penerimaan zakat."} />}
                />
                
                {meta.last_page > 1 && (
                    <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between gap-3 mt-2 shrink-0">
                        <span className="text-sm text-slate-500">
                            <span className="font-semibold text-slate-800">{meta.total}</span> data{" · Halaman "}
                            <span className="font-semibold text-slate-800">{meta.current_page}</span> dari <span className="font-semibold text-slate-800">{meta.last_page}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
                                <button key={p} type="button" onClick={() => handlePageNav(p)} className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${p === meta.current_page ? "bg-emerald-600 text-white border-emerald-600 cursor-default" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <PenerimaanZakatFormPanel isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} muzakkis={rootData.muzakkis || []} />
            <ConfirmDialog isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} onConfirm={confirmDelete} title="Hapus Transaksi?" variant="danger">
                Apakah Anda yakin ingin menghapus catatan penerimaan ini? Tindakan ini akan menghapus transaksi kas terkait secara permanen.
            </ConfirmDialog>
        </AppLayout>
    );
}
