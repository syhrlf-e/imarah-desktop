import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
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

// ── Main Component ─────────────────────────────────────────
export default function Index({ muzakkis = EMPTY_PAGE, filters = {} }: Props) {
    const [searchParams, setSearchParams] = useSearchParams();
    const auth = { user: { role: 'super_admin' } };
    const canCreate = ["super_admin", "bendahara", "petugas_zakat"].includes(
        auth.user.role,
    );

    const [search, setSearch] = useState(filters.search || "");
    const [sortOrder, setSortOrder] = useState<"terbaru" | "terlama">(
        "terbaru",
    );
    const [sortAlpha, setSortAlpha] = useState<"a-z" | "z-a">("a-z");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMuzakki, setEditingMuzakki] = useState<Muzakki | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [importData, _setImportData] = useState<{ file: File | null }>({ file: null });
    const setImportData = (key: string, value: any) => _setImportData(prev => ({ ...prev, [key]: value }));
    const postImport = (url: string, options: any) => {};
    const importing = false;
    const resetImport = () => {};

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
            if (search !== (filters.search || "")) {
                const nextParams = new URLSearchParams(searchParams);
                if (search) nextParams.set('search', search);
                else nextParams.delete('search');
                setSearchParams(nextParams, { replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, filters.search, searchParams, setSearchParams]);

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
                // TODO: fetch DELETE API request
                setConfirmDeleteId(null);
            } catch (err) {
                // Handle error
            }
        }
    };
    const handleImport = async () => {
        if (!importData.file) return;
        try {
            // TODO: fetch POST import request
            setIsImportOpen(false);
            resetImport();
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err) {
            // Handle error
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
                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-medium cursor-pointer"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Import Excel
                    </button>
                    {muzakkis.data.length > 0 && (
                        <PrimaryButton
                            onClick={handleCreate}
                            className="!py-2.5 font-medium cursor-pointer"
                        >
                            <Plus className="w-5 h-5" />
                            Daftarkan Muzakki
                        </PrimaryButton>
                    )}
                </PageHeader>

                <FilterBar
                    searchPlaceholder="Cari nama jamaah atau nomor telepon..."
                    searchValue={search}
                    onSearchChange={setSearch}
                >
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
                </FilterBar>

                <DataTable
                    className="flex-1 min-h-[400px]"
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
                        ] satisfies ColumnDef<(typeof muzakkis.data)[0]>[]
                    }
                    data={muzakkis.data}
                    keyExtractor={(row) => row.id}
                    emptyState={
                        <EmptyState
                            message="Belum ada data muzakki yang sesuai kriteria pencarian."
                            actionLabel="Daftarkan Muzakki"
                            onAction={handleCreate}
                        />
                    }
                />

                {/* Pagination */}
                {muzakkis.last_page > 1 && (
                    <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-row items-center justify-between gap-3 mt-2 shrink-0">
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

            {isImportOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 rounded-xl">
                                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Import Data Muzakki
                                </h3>
                            </div>
                            <button
                                onClick={() => {
                                    setIsImportOpen(false);
                                    resetImport();
                                }}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-green-300 transition-colors">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) =>
                                        setImportData(
                                            "file",
                                            e.target.files?.[0] || null,
                                        )
                                    }
                                    className="hidden"
                                    id="import-file-muzakki"
                                />
                                <label
                                    htmlFor="import-file-muzakki"
                                    className="cursor-pointer"
                                >
                                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-700">
                                        {importData.file
                                            ? importData.file.name
                                            : "Klik untuk pilih file"}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        .xlsx, .xls, atau .csv (maks 5MB)
                                    </p>
                                </label>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500">
                                <p className="font-semibold text-slate-600 mb-1">
                                    Format kolom Excel:
                                </p>
                                <p>Nama | No HP | Alamat</p>
                                <p className="mt-1 text-slate-400">
                                    Baris pertama harus berisi header (Nama,
                                    No_HP, Alamat)
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-6 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    setIsImportOpen(false);
                                    resetImport();
                                }}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!importData.file || importing}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {importing ? "Mengimport..." : "Import Data"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
