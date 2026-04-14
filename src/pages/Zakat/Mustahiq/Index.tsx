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
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        try {
            const form = new FormData();
            form.append('file', file);
            await import('@/lib/api').then(m => m.default.post('/zakat/mustahiq/import', form));
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
                    title="Data Mustahiq"
                    description="Kelola data penerima zakat berdasarkan pembagian 8 Ashnaf."
                />

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
                                <PrimaryButton
                                    onClick={handleCreate}
                                    className="py-2.5! font-semibold shadow-sm active:scale-95 transition-all cursor-pointer"
                                >
                                    <Plus className="w-5 h-5 mr-1" />
                                    Daftarkan Mustahiq
                                </PrimaryButton>
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
                            message={
                                search || ashnafFilter
                                    ? "Data mustahiq tidak ditemukan."
                                    : "Belum ada data mustahiq yang tercatat."
                            }
                        />
                    }
                />

                {mustahiqs.last_page > 1 && (
                    <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 shrink-0">
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
        </AppLayout>
    );
}
