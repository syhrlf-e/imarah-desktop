import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useMuzakkiData, useMuzakkiMutation } from "@/hooks/api/useZakat";
import AppLayout from "@/layouts/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import PrimaryButton from "@/components/PrimaryButton";
import MuzakkiForm from "./Components/MuzakkiForm";
import {
    Plus,
    Search,
    Trash2,
    Edit2,
    Phone,
    MapPin,
    ChevronLeft,
    ChevronRight,
    Upload,
    FileSpreadsheet,
    X,
    ArrowUpDown,
    SlidersHorizontal,
} from "lucide-react";
import FilterBar from "@/components/FilterBar";
import PageHeader from "@/components/PageHeader";
import { useDate } from "@/hooks/useDate";
import { motion, AnimatePresence } from "framer-motion";
import DataTable, { ColumnDef } from "@/components/DataTable";

interface Muzakki {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
}

interface Props {
    muzakkis?: {
        data: Muzakki[];
        links: any[];
        from: number;
        to: number;
        total: number;
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    filters?: {
        search?: string;
    };
}

const EMPTY_PAGE = { data: [], links: [], from: 0, to: 0, total: 0, current_page: 1, last_page: 1, prev_page_url: null, next_page_url: null };

export default function MuzakkiIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const canCreate = ["super_admin", "bendahara", "petugas_zakat"].includes(user?.role ?? '');

    const { data: muzakkisRes } = useMuzakkiData(searchParams.toString());
    const { remove } = useMuzakkiMutation();

    const rootData = muzakkisRes?.data ?? {};
    const rawMuzakkis = rootData.muzakkis ?? muzakkisRes ?? EMPTY_PAGE;
    const metaParams = rawMuzakkis.meta ?? rawMuzakkis;

    const muzakkis = {
        ...rawMuzakkis,
        current_page: metaParams.current_page || 1,
        last_page: metaParams.last_page || 1,
        total: metaParams.total || 0,
        prev_page_url: metaParams.current_page > 1 ? "yes" : null,
        next_page_url: metaParams.current_page < metaParams.last_page ? "yes" : null,
    };

    const localMuzakkis = rawMuzakkis.items ?? rawMuzakkis.data ?? [];

    const { masehiDateStr, hijriDate } = useDate();

    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState<"terbaru" | "terlama">("terbaru");
    const [sortAlpha, setSortAlpha] = useState<"a-z" | "z-a">("a-z");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMuzakki, setEditingMuzakki] = useState<Muzakki | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    const handlePageNav = (direction: number, url: string | null) => {
        if (!url) return;
        const newUrl = new URL(url);
        const page = newUrl.searchParams.get("page");

        const nextParams = new URLSearchParams(searchParams);
        if (search) nextParams.set('search', search);
        if (sortAlpha) nextParams.set('sort', sortAlpha);
        if (sortOrder) nextParams.set('order', sortOrder);
        if (page) nextParams.set('page', page);

        setSearchParams(nextParams, { replace: true });
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            const nextParams = new URLSearchParams(searchParams);
            if (search) nextParams.set('search', search);
            else nextParams.delete('search');
            setSearchParams(nextParams, { replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [search, searchParams, setSearchParams]);

    const handleSortToggle = () => {
        const next = sortOrder === "terbaru" ? "terlama" : "terbaru";
        setSortOrder(next);
        const nextParams = new URLSearchParams(searchParams);
        if (search) nextParams.set('search', search);
        nextParams.set('order', next);
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
            try {
                await remove.mutateAsync(confirmDeleteId);
                setConfirmDeleteId(null);
            } catch (err) {
                // Handle error
            }
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
        } catch {
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <AppLayout title="Pengelola Zakat">




            {/* ═══════════════════════════════════════
                DESKTOP ONLY — tidak berubah
                ═══════════════════════════════════════ */}
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
                        <button
                            type="button"
                            onClick={() =>
                                setSortAlpha(sortAlpha === "a-z" ? "z-a" : "a-z")
                            }
                            className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                        >
                            <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
                            {sortAlpha === "a-z" ? "A-Z" : "Z-A"}
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setSortOrder(
                                    sortOrder === "terbaru" ? "terlama" : "terbaru",
                                )
                            }
                            className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                        >
                            <SlidersHorizontal className="w-4 h-4 mr-2 text-slate-400" />
                            {sortOrder === "terbaru" ? "Terbaru" : "Terlama"}
                        </button>

                        {canCreate && (
                            <>
                                <div className="h-6 w-px bg-slate-200 mx-1" />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={importing}
                                    className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-medium cursor-pointer disabled:opacity-50 shadow-sm"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {importing ? "Mengimport..." : "Import Excel"}
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-sm shadow-sm flex items-center justify-center cursor-pointer"
                                >
                                    Daftarkan Muzakki
                                </button>
                            </>
                        )}
                    </div>
                </FilterBar>

                <DataTable
                    className="flex-1 min-h-100"
                    tableFixed
                    columns={
                        [
                            {
                                key: "info",
                                header: "Informasi Muzakki",
                                render: (muzakki) => (
                                    <div className="flex items-center">
                                        <div>
                                            <div className="font-bold text-slate-800">
                                                {muzakki.name}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                ID: {muzakki.id.substring(0, 8)}
                                                ...
                                            </div>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: "phone",
                                header: "Kontak",
                                cellClassName:
                                    "whitespace-nowrap text-slate-600 font-medium",
                                render: (muzakki) =>
                                    muzakki.phone ? (
                                        <div className="flex items-center text-slate-600">
                                            <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                            {muzakki.phone}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 italic">
                                            Belum diisi
                                        </span>
                                    ),
                            },
                            {
                                key: "address",
                                header: "Alamat",
                                cellClassName: "text-slate-600 max-w-xs",
                                render: (muzakki) =>
                                    muzakki.address ? (
                                        <div className="flex items-start">
                                            <MapPin className="w-3.5 h-3.5 mr-2 mt-1 text-slate-400 shrink-0" />
                                            <span className="truncate">
                                                {muzakki.address}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 italic">
                                            Belum diisi
                                        </span>
                                    ),
                            },
                            {
                                key: "actions",
                                header: "Aksi",
                                headerClassName: "text-right pr-6",
                                cellClassName:
                                    "whitespace-nowrap text-right text-sm",
                                render: (muzakki) => (
                                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(muzakki)}
                                            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Edit Data"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(muzakki.id)
                                            }
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Hapus Data"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ),
                            },
                        ] satisfies ColumnDef<(typeof localMuzakkis)[0]>[]
                    }
                    data={localMuzakkis}
                    keyExtractor={(row) => row.id}
                    emptyState={
                        <EmptyState
                            message={
                                search
                                    ? "Data muzakki tidak ditemukan."
                                    : "Belum ada data muzakki yang tercatat."
                            }
                        />
                    }
                />

                {/* Pagination */}
                {muzakkis.last_page > 1 && (
                    <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 shrink-0">
                        <span className="text-sm text-slate-500">
                            <span className="font-semibold text-slate-800">
                                {muzakkis.total}
                            </span>{" "}
                            data{" · Halaman "}
                            <span className="font-semibold text-slate-800">
                                {muzakkis.current_page}
                            </span>{" "}
                            dari{" "}
                            <span className="font-semibold text-slate-800">
                                {muzakkis.last_page}
                            </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={!muzakkis.prev_page_url}
                                onClick={() =>
                                    handlePageNav(-1, muzakkis.prev_page_url)
                                }
                                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <AnimatePresence mode="popLayout">
                                {[
                                    muzakkis.current_page - 1,
                                    muzakkis.current_page,
                                    muzakkis.current_page + 1,
                                ]
                                    .filter(
                                        (p) =>
                                            p >= 1 && p <= muzakkis.last_page,
                                    )
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
                                                if (p === muzakkis.current_page)
                                                    return;
                                                handlePageNav(
                                                    p > muzakkis.current_page
                                                        ? 1
                                                        : -1,
                                                    p > muzakkis.current_page
                                                        ? muzakkis.next_page_url
                                                        : muzakkis.prev_page_url,
                                                );
                                            }}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${
                                                p === muzakkis.current_page
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
                                disabled={!muzakkis.next_page_url}
                                onClick={() =>
                                    handlePageNav(1, muzakkis.next_page_url)
                                }
                                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modals (always rendered) ── */}
            <MuzakkiForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                muzakki={editingMuzakki}
            />
            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={confirmDelete}
                title="Hapus Muzakki?"
                variant="danger"
            >
                Apakah Anda yakin ingin menghapus data ini? Data transaksi
                terkait tidak akan dihapus permanen, namun status donatur ini
                akan dinonaktifkan.
            </ConfirmDialog>
        </AppLayout>
    );
}
