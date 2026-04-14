import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePenerimaanData, usePenerimaanMutation, useMuzakkiData } from "@/hooks/api/useZakat";
import AppLayout from "@/layouts/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import EmptyState from "@/components/EmptyState";
import PrimaryButton from "@/components/PrimaryButton";
import ZakatForm from "./Components/ZakatForm";
import {
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    SlidersHorizontal,
} from "lucide-react";
import FilterBar from "@/components/FilterBar";
import PageHeader from "@/components/PageHeader";
import DataTable, { ColumnDef } from "@/components/DataTable";
import { formatRupiah } from "@/utils/formatter";
import { motion, AnimatePresence } from "framer-motion";

interface Transaction {
    id: string;
    created_at: string;
    donatur_name: string;
    category: string;
    amount: number;
    payment_method: string;
    notes: string | null;
    status: string;
}

interface Muzakki {
    id: string;
    name: string;
}

interface Props {
    transactions?: {
        data: Transaction[];
        links: any[];
        from: number;
        to: number;
        total: number;
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    muzakkis?: Muzakki[];
}

const categoryLabel = (cat: string) =>
    cat === "zakat_maal" ? "Zakat Maal" : "Zakat Fitrah";

const paymentLabel = (method: string) => {
    switch (method) {
        case "tunai":
            return "Tunai";
        case "transfer":
            return "Transfer";
        case "qris":
            return "QRIS";
        default:
            return method;
    }
};

const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

const EMPTY_PAGE = { data: [] as Transaction[], links: [], from: 0, to: 0, total: 0, current_page: 1, last_page: 1, prev_page_url: null, next_page_url: null };

// ── Main Component ─────────────────────────────────────────
export default function PenerimaanIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const canCreate = ["super_admin", "bendahara", "petugas_zakat"].includes(user?.role ?? '');

    const { data: transactionsRes } = usePenerimaanData(searchParams.toString());
    const { remove } = usePenerimaanMutation();

    const rootData = transactionsRes?.data ?? {};
    const rawTransactions = rootData.transactions ?? transactionsRes ?? EMPTY_PAGE;
    const metaParams = rawTransactions.meta ?? rawTransactions;
    
    const transactions = {
        ...rawTransactions,
        current_page: metaParams.current_page || 1,
        last_page: metaParams.last_page || 1,
        total: metaParams.total || 0,
        prev_page_url: metaParams.current_page > 1 ? "yes" : null,
        next_page_url: metaParams.current_page < metaParams.last_page ? "yes" : null,
    };
    
    const localTransactions = rawTransactions.items ?? rawTransactions.data ?? [];
    const muzakkis = rootData.muzakkis ?? [];

    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState<"terbaru" | "terlama">(
        "terbaru",
    );
    const [sortAlpha, setSortAlpha] = useState<"a-z" | "z-a">("a-z");
    const [jenisFilter, setJenisFilter] = useState<
        "" | "zakat_maal" | "zakat_fitrah"
    >("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);


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

    const handleSortToggle = () => {
        const next = sortOrder === "terbaru" ? "terlama" : "terbaru";
        setSortOrder(next);
        const nextParams = new URLSearchParams(searchParams);
        if (search) nextParams.set('search', search);
        nextParams.set('order', next);
        setSearchParams(nextParams, { replace: true });
    };

    // Filter data client-side untuk jenis zakat (mobile toggle)
    const filteredData = jenisFilter
        ? localTransactions.filter((t: Transaction) => t.category === jenisFilter)
        : localTransactions;

    const confirmDelete = async () => {
        if (confirmDeleteId) {
            try {
                await remove.mutateAsync(confirmDeleteId);
                setConfirmDeleteId(null);
            } catch (err) { }
        }
    };

    return (
        <AppLayout title="Pengelola Zakat">
            



            {/* ═══════════════════════════════════════
                DESKTOP ONLY — tidak berubah
                ═══════════════════════════════════════ */}
            <div className="contents">
                <PageHeader
                    title="Penerimaan Zakat"
                    description="Pencatatan pemasukan Zakat Maal dan Zakat Fitrah dari para jamaah."
                />

                <FilterBar
                    searchPlaceholder="Cari penerimaan..."
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
                                <PrimaryButton
                                    onClick={() => setIsFormOpen(true)}
                                    className="!py-2.5 font-semibold shadow-sm active:scale-95 transition-all"
                                >
                                    <Plus className="w-5 h-5 mr-1" />
                                    Catat Penerimaan Zakat
                                </PrimaryButton>
                            </>
                        )}
                    </div>
                </FilterBar>

                <DataTable
                    className="flex-1 min-h-[400px]"
                    tableFixed
                    columns={
                        [
                            {
                                key: "tanggal",
                                header: "Tanggal Penerimaan",
                                cellClassName:
                                    "whitespace-nowrap text-slate-600 font-medium",
                                render: (trx) => trx.created_at,
                            },
                            {
                                key: "muzakki",
                                header: "Nama Muzakki",
                                cellClassName: "whitespace-nowrap",
                                render: (trx) => (
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold mr-3">
                                            {trx.donatur_name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <span className="font-bold text-slate-800">
                                            {trx.donatur_name}
                                        </span>
                                    </div>
                                ),
                            },
                            {
                                key: "jenis",
                                header: "Jenis Zakat",
                                cellClassName: "whitespace-nowrap",
                                render: (trx) => (
                                    <span
                                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold border ${trx.category === "zakat_maal" ? "bg-blue-50 text-blue-700 border-blue-200/50" : "bg-green-50 text-green-700 border-green-200/50"}`}
                                    >
                                        {categoryLabel(trx.category)}
                                    </span>
                                ),
                            },
                            {
                                key: "metode",
                                header: "Metode Bayar",
                                cellClassName: "whitespace-nowrap",
                                render: (trx) => (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 capitalize border border-slate-200">
                                        {paymentLabel(trx.payment_method)}
                                    </span>
                                ),
                            },
                            {
                                key: "keterangan",
                                header: "Keterangan",
                                cellClassName:
                                    "text-slate-600 max-w-xs truncate",
                                render: (trx) =>
                                    trx.notes || (
                                        <span className="italic text-slate-400">
                                            -
                                        </span>
                                    ),
                            },
                            {
                                key: "nominal",
                                header: "Nominal",
                                headerClassName: "text-right",
                                cellClassName:
                                    "whitespace-nowrap text-right font-bold text-green-600 text-base",
                                render: (trx) => formatRupiah(trx.amount),
                            },
                        ] satisfies ColumnDef<(typeof localTransactions)[0]>[]
                    }
                    data={localTransactions}
                    keyExtractor={(row) => row.id}
                    emptyState={
                        <EmptyState
                            message={
                                search
                                    ? "Data penerimaan tidak ditemukan."
                                    : "Belum ada riwayat penerimaan zakat yang tercatat."
                            }
                        />
                    }
                />

                {transactions.last_page > 1 && (
                    <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-row items-center justify-between gap-3 mt-2 shrink-0">
                        <span className="text-sm text-slate-500">
                            <span className="font-semibold text-slate-800">
                                {transactions.total}
                            </span>{" "}
                            data{" · Halaman "}
                            <span className="font-semibold text-slate-800">
                                {transactions.current_page}
                            </span>{" "}
                            dari{" "}
                            <span className="font-semibold text-slate-800">
                                {transactions.last_page}
                            </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={!transactions.prev_page_url}
                                onClick={() =>
                                    handlePageNav(
                                        -1,
                                        transactions.prev_page_url,
                                    )
                                }
                                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <AnimatePresence mode="popLayout">
                                {[
                                    transactions.current_page - 1,
                                    transactions.current_page,
                                    transactions.current_page + 1,
                                ]
                                    .filter(
                                        (p) =>
                                            p >= 1 &&
                                            p <= transactions.last_page,
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
                                                    p ===
                                                    transactions.current_page
                                                )
                                                    return;
                                                handlePageNav(
                                                    p >
                                                        transactions.current_page
                                                        ? 1
                                                        : -1,
                                                    p >
                                                        transactions.current_page
                                                        ? transactions.next_page_url
                                                        : transactions.prev_page_url,
                                                );
                                            }}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${p === transactions.current_page ? "bg-green-600 text-white border-green-600 cursor-default" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                                        >
                                            {p}
                                        </motion.button>
                                    ))}
                            </AnimatePresence>
                            <button
                                type="button"
                                disabled={!transactions.next_page_url}
                                onClick={() =>
                                    handlePageNav(1, transactions.next_page_url)
                                }
                                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            <ZakatForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                muzakkis={muzakkis}
            />
        </AppLayout>
    );
}
