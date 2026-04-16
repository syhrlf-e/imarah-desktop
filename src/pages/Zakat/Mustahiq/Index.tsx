import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useMustahiqData, useMustahiqMutation } from "@/hooks/api/useZakat";
import AppLayout from "@/layouts/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import MustahiqFormPanel from "./Components/MustahiqFormPanel";
import {
    Trash2,
    Edit2,
    ArrowUpDown,
    SlidersHorizontal,
} from "lucide-react";
import FilterBar from "@/components/FilterBar";
import PageHeader from "@/components/PageHeader";
import { useDate } from "@/hooks/useDate";
import DataTable, { ColumnDef } from "@/components/DataTable";

interface Mustahiq {
    id: string;
    name: string;
    category: string;
    phone: string | null;
    address: string | null;
    created_at?: string;
}

const EMPTY_PAGE = { data: [], links: [], from: 0, to: 0, total: 0, current_page: 1, last_page: 1, prev_page_url: null, next_page_url: null };

export default function MustahiqIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const canCreate = ["super_admin", "bendahara", "petugas_zakat"].includes(user?.role ?? '');

    const { data: mustahiqsRes, isLoading } = useMustahiqData(searchParams.toString());
    const { remove } = useMustahiqMutation();
    
    const rootData = mustahiqsRes?.data ?? {};
    const rawMustahiqs = rootData.mustahiqs ?? mustahiqsRes ?? EMPTY_PAGE;
    const metaParams = rawMustahiqs.meta ?? rawMustahiqs;

    const mustahiqs = {
        ...rawMustahiqs,
        current_page: metaParams.current_page || 1,
        last_page: metaParams.last_page || 1,
        total: metaParams.total || 0,
    };

    const localMustahiqs = rawMustahiqs.items ?? rawMustahiqs.data ?? [];
    
    const { masehiDateStr, hijriDate } = useDate();

    const [search, setSearch] = useState(searchParams.get('search') || "");
    const [sortOrder, setSortOrder] = useState<'terbaru' | 'terlama'>(searchParams.get('order') as any || 'terbaru');
    const [sortAlpha, setSortAlpha] = useState<'a-z' | 'z-a'>(searchParams.get('sort') as any || 'a-z');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMustahiq, setEditingMustahiq] = useState<Mustahiq | null>(null);
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

    const handleSort = (key: 'order' | 'sort', value: string) => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set(key, value);
        if (key === 'sort') setSortAlpha(value as 'a-z' | 'z-a');
        if (key === 'order') setSortOrder(value as 'terbaru' | 'terlama');
        setSearchParams(nextParams, { replace: true });
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

    return (
        <AppLayout title="Pengelola Zakat">
            <div className="contents">
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
                    searchValue={search}
                    onSearchChange={setSearch}
                >
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleSort('sort', sortAlpha === 'a-z' ? 'z-a' : 'a-z')} className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                            <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
                            {sortAlpha === "a-z" ? "A-Z" : "Z-A"}
                        </button>
                        <button type="button" onClick={() => handleSort('order', sortOrder === 'terbaru' ? 'terlama' : 'terbaru')} className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                            <SlidersHorizontal className="w-4 h-4 mr-2 text-slate-400" />
                            {sortOrder === "terbaru" ? "Terbaru" : "Terlama"}
                        </button>

                        {canCreate && (
                            <button onClick={handleCreate} className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-sm shadow-sm flex items-center justify-center cursor-pointer ml-2">
                                Daftarkan Mustahiq
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
                                key: "name",
                                header: "Nama Mustahiq",
                                cellClassName: "font-bold text-slate-800",
                                render: (mustahiq) => mustahiq.name,
                            },
                            {
                                key: "category",
                                header: "Kategori",
                                render: (mustahiq) => (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                                        {mustahiq.category}
                                    </span>
                                ),
                            },
                            {
                                key: "phone",
                                header: "Nomor HP",
                                cellClassName: "whitespace-nowrap text-slate-600",
                                render: (mustahiq) => mustahiq.phone || "-",
                            },
                            {
                                key: "address",
                                header: "Alamat",
                                cellClassName: "text-slate-600 max-w-md",
                                render: (mustahiq) => mustahiq.address || "-",
                            },
                            {
                                key: "actions",
                                header: "Aksi",
                                headerClassName: "text-right pr-6",
                                cellClassName: "whitespace-nowrap text-right text-sm",
                                render: (mustahiq) => (
                                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(mustahiq)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Data"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDelete(mustahiq.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Data"><Trash2 size={18} /></button>
                                    </div>
                                ),
                            },
                        ] satisfies ColumnDef<Mustahiq>[]
                    }
                    data={localMustahiqs}
                    isLoading={isLoading}
                    keyExtractor={(row) => row.id}
                    emptyState={<EmptyState message={search ? "Data mustahiq tidak ditemukan." : "Belum ada data mustahiq yang tercatat."} />}
                />
                
                {mustahiqs.last_page > 1 && (
                    <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between gap-3 mt-2 shrink-0">
                        <span className="text-sm text-slate-500">
                            <span className="font-semibold text-slate-800">{mustahiqs.total}</span> data{" · Halaman "}
                            <span className="font-semibold text-slate-800">{mustahiqs.current_page}</span> dari <span className="font-semibold text-slate-800">{mustahiqs.last_page}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: mustahiqs.last_page }, (_, i) => i + 1).map(p => (
                                <button key={p} type="button" onClick={() => handlePageNav(p)} className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${p === mustahiqs.current_page ? "bg-emerald-600 text-white border-emerald-600 cursor-default" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <MustahiqFormPanel isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} mustahiq={editingMustahiq} />
            <ConfirmDialog isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} onConfirm={confirmDelete} title="Hapus Mustahiq?" variant="danger">
                Apakah Anda yakin ingin menghapus data ini? Data transaksi terkait tidak akan dihapus permanen.
            </ConfirmDialog>
        </AppLayout>
    );
}
