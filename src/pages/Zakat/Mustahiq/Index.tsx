import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useMustahiqData, useMustahiqMutation } from "@/hooks/api/useZakat";
import AppLayout from "@/layouts/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import PrimaryButton from "@/components/PrimaryButton";
import CustomSelect from "@/components/CustomSelect";
import MustahiqForm from "./Components/MustahiqForm";
import {
    Plus,
    Search,
    Trash2,
    Edit2,
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

interface Mustahiq {
    id: string;
    name: string;
    ashnaf: string;
    address: string | null;
    description: string | null;
}

interface Props {
    mustahiqs?: {
        data: Mustahiq[];
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
        ashnaf?: string;
    };
}

const EMPTY_MUSTAHIQS = { data: [] as Mustahiq[], links: [], from: 0, to: 0, total: 0, current_page: 1, last_page: 1, prev_page_url: null, next_page_url: null };
const EMPTY_FILTERS = { search: "", ashnaf: "" };

const ASHNAF_LABELS: Record<string, string> = {
    fakir: "Fakir",
    miskin: "Miskin",
    amil: "Amil",
    mualaf: "Mualaf",
    riqab: "Riqab",
    gharim: "Gharim",
    fisabilillah: "Fisabilillah",
    ibnusabil: "Ibnu Sabil",
};

const ASHNAF_STYLES: Record<string, string> = {
    fakir: "bg-red-50 text-red-700 border-red-200/50",
    miskin: "bg-orange-50 text-orange-700 border-orange-200/50",
    amil: "bg-blue-50 text-blue-700 border-blue-200/50",
    mualaf: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
    riqab: "bg-purple-50 text-purple-700 border-purple-200/50",
    gharim: "bg-yellow-50 text-yellow-700 border-yellow-200/50",
    fisabilillah: "bg-teal-50 text-teal-700 border-teal-200/50",
    ibnusabil: "bg-indigo-50 text-indigo-700 border-indigo-200/50",
};

// ── Main Component ─────────────────────────────────────────
export default function MustahiqIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const canCreate = ["super_admin", "bendahara", "petugas_zakat"].includes(user?.role ?? '');

    const { data: mustahiqsRes } = useMustahiqData(searchParams.toString());
    const { remove } = useMustahiqMutation();
    
    const rootData = mustahiqsRes?.data ?? {};
    const rawMustahiqs = rootData.mustahiqs ?? mustahiqsRes ?? EMPTY_MUSTAHIQS;
    const metaParams = rawMustahiqs.meta ?? rawMustahiqs;

    const mustahiqs = {
        ...rawMustahiqs,
        current_page: metaParams.current_page || 1,
        last_page: metaParams.last_page || 1,
        total: metaParams.total || 0,
        prev_page_url: metaParams.current_page > 1 ? "yes" : null,
        next_page_url: metaParams.current_page < metaParams.last_page ? "yes" : null,
    };
    
    const localMustahiqs = rawMustahiqs.items ?? rawMustahiqs.data ?? [];

    const [search, setSearch] = useState("");
    const [ashnafFilter, setAshnafFilter] = useState("");
    const [sortOrder, setSortOrder] = useState<"terbaru" | "terlama">("terbaru");
    const [sortAlpha, setSortAlpha] = useState<"a-z" | "z-a">("a-z");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMustahiq, setEditingMustahiq] = useState<Mustahiq | null>(
        null,
    );
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);
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
        if (ashnafFilter) nextParams.set('ashnaf', ashnafFilter);
        if (sortAlpha) nextParams.set('sort', sortAlpha);
        if (sortOrder) nextParams.set('order', sortOrder);
        if (page) nextParams.set('page', page);
        
        setSearchParams(nextParams, { replace: true });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            const nextParams = new URLSearchParams(searchParams);
            if (search) nextParams.set('search', search);
            else nextParams.delete('search');
            if (ashnafFilter) nextParams.set('ashnaf', ashnafFilter);
            else nextParams.delete('ashnaf');
            setSearchParams(nextParams, { replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [search, ashnafFilter, searchParams, setSearchParams]);

    const handleSortToggle = () => {
        const next = sortOrder === "terbaru" ? "terlama" : "terbaru";
        setSortOrder(next);
        const nextParams = new URLSearchParams(searchParams);
        if (search) nextParams.set('search', search);
        if (ashnafFilter) nextParams.set('ashnaf', ashnafFilter);
        nextParams.set('order', next);
        setSearchParams(nextParams, { replace: true });
    };

    const handleCreate = () => {
        setEditingMustahiq(null);
        setIsFormOpen(true);
    };
    const handleEdit = (m: Mustahiq) => {
        setEditingMustahiq(m);
        setIsFormOpen(true);
    };
    const handleDelete = (id: string) => setConfirmDeleteId(id);
    const confirmDelete = async () => {
        if (confirmDeleteId) {
            try {
                await remove.mutateAsync(confirmDeleteId);
                setConfirmDeleteId(null);
            } catch (err) {
                
            }
        }
    };
    const handleImport = async () => {
        if (!importFile) return;
        setImporting(true);
        try {
            const form = new FormData();
            form.append('file', importFile);
            await import('@/lib/api').then(m => m.default.post('/zakat/mustahiq/import', form));
            setIsImportOpen(false);
            setImportFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch {
        } finally {
            setImporting(false);
        }
    };

    return (
        <AppLayout title="Pengelola Zakat">
            



            {/* ═══════════════════════════════════════
                DESKTOP ONLY — tidak berubah
                ═══════════════════════════════════════ */}
            <div className="contents">
                <PageHeader
                    title="Data Mustahiq"
                    description="Kelola data penerima zakat berdasarkan pembagian 8 Ashnaf."
                >
                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-medium cursor-pointer"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Import Excel
                    </button>
                    {mustahiqs.data.length > 0 && (
                        <PrimaryButton
                            onClick={handleCreate}
                            className="!py-2.5 font-medium cursor-pointer"
                        >
                            <Plus className="w-5 h-5" />
                            Daftarkan Mustahiq
                        </PrimaryButton>
                    )}
                </PageHeader>

                <FilterBar
                    searchPlaceholder="Cari nama jamaah atau alamat..."
                    searchValue={search}
                    onSearchChange={setSearch}
                    addon={
                        <>
                            <CustomSelect
                                value={ashnafFilter}
                                onChange={(val) => setAshnafFilter(val)}
                                className="w-full sm:w-48"
                                options={[
                                    { value: "", label: "Semua Kategori" },
                                    ...Object.entries(ASHNAF_LABELS).map(
                                        ([value, label]) => ({ value, label }),
                                    ),
                                ]}
                            />
                        </>
                    }
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
                                key: "data",
                                header: "Data Mustahiq",
                                cellClassName: "whitespace-nowrap",
                                render: (mustahiq) => (
                                    <div className="flex items-center">
                                        <div className="font-bold text-slate-800">
                                            {mustahiq.name}
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: "ashnaf",
                                header: "Kategori (Ashnaf)",
                                cellClassName: "whitespace-nowrap",
                                render: (mustahiq) => (
                                    <span className="font-medium text-slate-700 capitalize">
                                        {ASHNAF_LABELS[mustahiq.ashnaf] ||
                                            mustahiq.ashnaf}
                                    </span>
                                ),
                            },
                            {
                                key: "alamat",
                                header: "Alamat",
                                cellClassName: "text-slate-600 max-w-xs",
                                render: (mustahiq) =>
                                    mustahiq.address ? (
                                        <div className="flex items-start">
                                            <MapPin className="w-4 h-4 mr-2 mt-0.5 text-slate-400 shrink-0" />
                                            <span className="truncate">
                                                {mustahiq.address}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 italic">
                                            Belum diisi
                                        </span>
                                    ),
                            },
                            {
                                key: "keterangan",
                                header: "Keterangan",
                                cellClassName: "text-slate-600 max-w-xs",
                                render: (mustahiq) => (
                                    <div className="line-clamp-2">
                                        {mustahiq.description || (
                                            <span className="text-slate-400 italic">
                                                Tidak ada keterangan
                                            </span>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: "actions",
                                header: "Aksi",
                                headerClassName: "text-right pr-6",
                                cellClassName:
                                    "whitespace-nowrap text-right text-sm",
                                render: (mustahiq) => (
                                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(mustahiq)}
                                            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Edit Data"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(mustahiq.id)
                                            }
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Hapus Data"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ),
                            },
                        ] satisfies ColumnDef<(typeof localMustahiqs)[0]>[]
                    }
                    data={localMustahiqs}
                    keyExtractor={(row) => row.id}
                    emptyState={
                        <EmptyState
                            message="Belum ada data mustahiq yang sesuai kriteria pencarian."
                            actionLabel="Daftarkan Mustahiq"
                            onAction={handleCreate}
                        />
                    }
                />

                {mustahiqs.last_page > 1 && (
                    <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-row items-center justify-between gap-3 mt-2 shrink-0">
                        <span className="text-sm text-slate-500">
                            <span className="font-semibold text-slate-800">
                                {mustahiqs.total}
                            </span>{" "}
                            data{" · Halaman "}
                            <span className="font-semibold text-slate-800">
                                {mustahiqs.current_page}
                            </span>{" "}
                            dari{" "}
                            <span className="font-semibold text-slate-800">
                                {mustahiqs.last_page}
                            </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={!mustahiqs.prev_page_url}
                                onClick={() =>
                                    handlePageNav(-1, mustahiqs.prev_page_url)
                                }
                                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <AnimatePresence mode="popLayout">
                                {[
                                    mustahiqs.current_page - 1,
                                    mustahiqs.current_page,
                                    mustahiqs.current_page + 1,
                                ]
                                    .filter(
                                        (p) =>
                                            p >= 1 && p <= mustahiqs.last_page,
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
                                                if (
                                                    p === mustahiqs.current_page
                                                )
                                                    return;
                                                handlePageNav(
                                                    p > mustahiqs.current_page
                                                        ? 1
                                                        : -1,
                                                    p > mustahiqs.current_page
                                                        ? mustahiqs.next_page_url
                                                        : mustahiqs.prev_page_url,
                                                );
                                            }}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${p === mustahiqs.current_page ? "bg-green-600 text-white border-green-600 cursor-default" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                                        >
                                            {p}
                                        </motion.button>
                                    ))}
                            </AnimatePresence>
                            <button
                                type="button"
                                disabled={!mustahiqs.next_page_url}
                                onClick={() =>
                                    handlePageNav(1, mustahiqs.next_page_url)
                                }
                                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            <MustahiqForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                mustahiq={editingMustahiq}
            />
            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={confirmDelete}
                title="Hapus Mustahiq?"
                variant="danger"
            >
                Apakah Anda yakin ingin menghapus data ini?
            </ConfirmDialog>

            {isImportOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-xl">
                                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Import Data Mustahiq
                                </h3>
                            </div>
                            <button
                                onClick={() => {
                                    setIsImportOpen(false);
                                    setImportFile(null);
                                }}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) =>
                                        setImportFile(e.target.files?.[0] || null)
                                    }
                                    className="hidden"
                                    id="import-file-mustahiq"
                                />
                                <label
                                    htmlFor="import-file-mustahiq"
                                    className="cursor-pointer"
                                >
                                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-700">
                                        {importFile
                                            ? importFile.name
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
                                <p>Nama | Ashnaf | Alamat | Keterangan</p>
                                <p className="mt-1 text-slate-400">
                                    Ashnaf: fakir, miskin, amil, mualaf, riqab,
                                    gharim, fisabilillah, ibnusabil
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-6 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    setIsImportOpen(false);
                                    setImportFile(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!importFile || importing}
                                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
