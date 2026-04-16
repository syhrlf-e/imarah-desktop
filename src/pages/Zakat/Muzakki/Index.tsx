import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useMuzakkiData, useMuzakkiMutation } from "@/hooks/api/useZakat";
import AppLayout from "@/layouts/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import MuzakkiFormPanel from "./Components/MuzakkiFormPanel";
import {
    Trash2,
    Edit2,
    ArrowUpDown,
    SlidersHorizontal,
    Upload,
} from "lucide-react";
import FilterBar from "@/components/FilterBar";
import PageHeader from "@/components/PageHeader";
import { useDate } from "@/hooks/useDate";
import DataTable, { ColumnDef } from "@/components/DataTable";

interface Muzakki {
    id: string;
    name: string;
    jenis_kelamin: "L" | "P";
    jumlah_tanggungan: number;
    phone: string | null;
    alamat: string | null;
    rt: string | null;
    rw: string | null;
    is_active: boolean | number;
}

const EMPTY_PAGE = { data: [], links: [], from: 0, to: 0, total: 0, current_page: 1, last_page: 1, prev_page_url: null, next_page_url: null };

export default function MuzakkiIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const canCreate = ["super_admin", "bendahara", "petugas_zakat"].includes(user?.role ?? '');

    const { data: muzakkisRes, isLoading } = useMuzakkiData(searchParams.toString());
    const { remove } = useMuzakkiMutation();
    
    const rootData = muzakkisRes?.data ?? {};
    const rawMuzakkis = rootData.muzakkis ?? muzakkisRes ?? EMPTY_PAGE;
    const metaParams = rawMuzakkis.meta ?? rawMuzakkis;

    const muzakkis = {
        ...rawMuzakkis,
        current_page: metaParams.current_page || 1,
        last_page: metaParams.last_page || 1,
        total: metaParams.total || 0,
    };

    const localMuzakkis = rawMuzakkis.items ?? rawMuzakkis.data ?? [];
    
    const { masehiDateStr, hijriDate } = useDate();

    const [search, setSearch] = useState(searchParams.get('search') || "");
    const [sortOrder, setSortOrder] = useState<'terbaru' | 'terlama'>(searchParams.get('order') as any || 'terbaru');
    const [sortAlpha, setSortAlpha] = useState<'a-z' | 'z-a'>(searchParams.get('sort') as any || 'a-z');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMuzakki, setEditingMuzakki] = useState<Muzakki | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);

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
        setEditingMuzakki(null);
        setIsFormOpen(true);
    };
    const handleEdit = (muzakki: Muzakki) => {
        setEditingMuzakki(muzakki);
        setIsFormOpen(true);
    };
    const handleDelete = (id: string) => setConfirmDeleteId(id);
    const confirmDelete = async () => {
        if (confirmDeleteId) {
            await remove.mutateAsync(confirmDeleteId);
            setConfirmDeleteId(null);
        }
    };
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        try {
            const form = new FormData();
            form.append('file', file);
            await import('@/lib/api').then(m => m.default.post('/zakat/muzakki/import', form));
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <AppLayout title="Pengelola Zakat">
            <div className="contents">
                <PageHeader
                    title="Data Muzakki"
                    description="Kelola direktori donatur zakat, infaq, dan shodaqoh."
                >
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{masehiDateStr}</p>
                        <p className="text-xs text-slate-500 mt-1">{hijriDate}</p>
                    </div>
                </PageHeader>

                <FilterBar
                    searchPlaceholder="Cari nama jamaah atau nomor telepon..."
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
                            <>
                                <div className="h-6 w-px bg-slate-200 mx-1" />
                                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-medium cursor-pointer disabled:opacity-50 shadow-sm">
                                    <Upload className="w-4 h-4 mr-2" />
                                    {importing ? "Mengimport..." : "Import Excel"}
                                </button>
                                <button onClick={handleCreate} className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-sm shadow-sm flex items-center justify-center cursor-pointer">
                                    Daftarkan Muzakki
                                </button>
                            </>
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
                                header: "Nama Muzakki",
                                cellClassName: "font-bold text-slate-800",
                                render: (muzakki) => muzakki.name,
                            },
                            {
                                key: "jenis_kelamin",
                                header: "Jenis Kelamin",
                                render: (muzakki) => (
                                    <span className="text-slate-600">
                                        {muzakki.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                                    </span>
                                ),
                            },
                            {
                                key: "jumlah_tanggungan",
                                header: "Jml. Tanggungan",
                                cellClassName: "text-center",
                                headerClassName: "text-center",
                                render: (muzakki) => (
                                    <span className="text-slate-600 font-medium">
                                        {muzakki.jumlah_tanggungan || 0}
                                    </span>
                                ),
                            },
                            {
                                key: "phone",
                                header: "Nomor HP",
                                cellClassName: "whitespace-nowrap text-slate-600",
                                render: (muzakki) => muzakki.phone || "-",
                            },
                            {
                                key: "alamat",
                                header: "Alamat",
                                cellClassName: "text-slate-600 max-w-md",
                                render: (muzakki) => {
                                    const parts = [];
                                    if (muzakki.alamat) parts.push(muzakki.alamat);
                                    if (muzakki.rt || muzakki.rw) {
                                        parts.push(`RT ${String(muzakki.rt || '0').padStart(3, '0')} / RW ${String(muzakki.rw || '0').padStart(3, '0')}`);
                                    }
                                    return parts.length > 0 ? parts.join(", ") : "-";
                                },
                            },
                            {
                                key: "is_active",
                                header: "Status",
                                render: (muzakki) => {
                                    const isActive = !!muzakki.is_active;
                                    return (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                            isActive 
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                                : "bg-slate-50 text-slate-600 border-slate-200"
                                        }`}>
                                            {isActive ? "Aktif" : "Nonaktif"}
                                        </span>
                                    );
                                }
                            },
                            {
                                key: "actions",
                                header: "Aksi",
                                headerClassName: "text-right pr-6",
                                cellClassName: "whitespace-nowrap text-right text-sm",
                                render: (muzakki) => (
                                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(muzakki)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Data"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDelete(muzakki.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Data"><Trash2 size={18} /></button>
                                    </div>
                                ),
                            },
                        ] satisfies ColumnDef<Muzakki>[]
                    }
                    data={localMuzakkis}
                    isLoading={isLoading}
                    keyExtractor={(row) => row.id}
                    emptyState={<EmptyState message={search ? "Data muzakki tidak ditemukan." : "Belum ada data muzakki yang tercatat."} />}
                />
                
                {muzakkis.last_page > 1 && (
                    <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between gap-3 mt-2 shrink-0">
                        <span className="text-sm text-slate-500">
                            <span className="font-semibold text-slate-800">{muzakkis.total}</span> data{" · Halaman "}
                            <span className="font-semibold text-slate-800">{muzakkis.current_page}</span> dari <span className="font-semibold text-slate-800">{muzakkis.last_page}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: muzakkis.last_page }, (_, i) => i + 1).map(p => (
                                <button key={p} type="button" onClick={() => handlePageNav(p)} className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${p === muzakkis.current_page ? "bg-green-600 text-white border-green-600 cursor-default" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <MuzakkiFormPanel isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} muzakki={editingMuzakki} />
            <ConfirmDialog isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} onConfirm={confirmDelete} title="Hapus Muzakki?" variant="danger">
                Apakah Anda yakin ingin menghapus data ini? Data transaksi terkait tidak akan dihapus permanen, namun status donatur ini akan dinonaktifkan.
            </ConfirmDialog>
        </AppLayout>
    );
}
