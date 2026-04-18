import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
import AppLayout from "@/layouts/AppLayout";
import { PaginatedResponse, Transaction, User } from "@/types";
import { formatRupiah, parseRupiah } from "@/utils/formatter";
import { useNetwork } from "@/hooks/useNetwork";
import { useKasSummary, useKasTransactions, useKasMutation } from "@/hooks/api/useKas";
import { useAuth } from "@/contexts/AuthContext";
import {
    Plus,
    CheckCircle,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Search,
    SlidersHorizontal,
    Wallet,
    ArrowDownRight,
    ArrowUpRight,
    TrendingUp,
    TrendingDown,
    Loader2,
    Filter,
    ChevronDown,
    Activity,
    Save,
    Clock,
    XCircle,
    Download,
} from "lucide-react";
import FilterBar from "@/components/FilterBar";
import PageHeader from "@/components/PageHeader";
import KasSummaryCards from "@/components/KasSummaryCards";
import DataTable, { ColumnDef } from "@/components/DataTable";
import PrimaryButton from "@/components/PrimaryButton";
import KasFormPanel from "./components/KasFormPanel";
import ConfirmDialog from "@/components/ConfirmDialog";

const CATEGORY_OPTIONS_IN = [
    { value: "zakat_fitrah", label: "Zakat Fitrah" },
    { value: "zakat_maal", label: "Zakat Maal" },
    { value: "infaq", label: "Infaq / Sedekah" },
    { value: "infaq_tromol", label: "Infaq Tromol" },
];

const CATEGORY_OPTIONS_OUT = [
    { value: "operasional", label: "Operasional" },
    { value: "gaji", label: "Gaji" },
    { value: "lainnya", label: "Lainnya" },
];

const ALL_CATEGORY_OPTIONS = [
    { value: "", label: "Semua Kategori" },
    ...CATEGORY_OPTIONS_IN,
    ...CATEGORY_OPTIONS_OUT,
];



interface BreakdownItem {
    category: string;
    total: number;
}

const EMPTY_TRANSACTIONS: PaginatedResponse<Transaction> = { data: [], links: [], from: 0, to: 0, total: 0, current_page: 1, last_page: 1, prev_page_url: null, next_page_url: null };
const EMPTY_SUMMARY = { pemasukan_bulan_ini: 0, pengeluaran_bulan_ini: 0, saldo_akhir_bulan: 0, saldo_total_kas: 0 };
const EMPTY_BREAKDOWN = { pemasukan: [], pengeluaran: [] };

export default function KasIndex({
    month = new Date().getMonth() + 1,
    year = new Date().getFullYear(),
}: { month?: string | number; year?: string | number; }) {
    const { user: authUser } = useAuth();
    const auth = { user: authUser ?? { id: '', name: 'Admin', role: 'super_admin' } as User };
    
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

    const search = searchParams.get("search") ?? "";
    const typeFilter = searchParams.get("type") ?? "";
    const categoryFilter = searchParams.get("category") ?? "";
    const sortOrder = searchParams.get("sort") ?? "terbaru";

    const { data: summaryData, isLoading: loadingSummary } = useKasSummary(month, year);
    const { data: kasData, isLoading: loadingKas, isFetching: fetchingKas } = useKasTransactions(searchParams.toString());
    const { store, verify, remove } = useKasMutation();

    const localTransactions = kasData?.data ?? kasData?.transactions?.items ?? [];
    const paginationMeta = kasData?.meta ?? kasData?.transactions ?? { current_page: 1, last_page: 1, total: 0 };

    // transactions object is used by the pagination UI
    const transactions = {
        current_page: paginationMeta.current_page,
        last_page: paginationMeta.last_page,
        total: paginationMeta.total,
        prev_page_url: paginationMeta.current_page > 1 ? "yes" : null,
        next_page_url: paginationMeta.current_page < paginationMeta.last_page ? "yes" : null,
    };
    const localSummary = summaryData?.summary ?? summaryData ?? EMPTY_SUMMARY;

    const [activeTab, setActiveTab] = useState<"tampilan" | "catat">("tampilan");
    const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmVerifyId, setConfirmVerifyId] = useState<string | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localSearch, setLocalSearch] = useState(search);

    // --- Single filter function ---
    const applyFilters = useCallback(
        (params: {
            search?: string;
            type?: string;
            category?: string;
            sort?: string;
            page?: number;
        }) => {
            const nextParams = new URLSearchParams(searchParams);
            if (params.search !== undefined) nextParams.set("search", params.search);
            if (params.type !== undefined) nextParams.set("type", params.type);
            if (params.category !== undefined) nextParams.set("category", params.category);
            if (params.sort !== undefined) nextParams.set("sort", params.sort);
            if (params.page !== undefined) nextParams.set("page", params.page.toString());
            
            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams],
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalSearch(val);
        
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            applyFilters({ search: val, page: 1 });
        }, 350);
    };

    const handleTypeChange = (newType: string) => {
        applyFilters({ type: newType, page: 1, category: "" });
    };

    const handleCategoryChange = (val: string) => {
        setIsCategoryFilterOpen(false);
        applyFilters({ category: val, page: 1 });
    };

    const handlePageNav = (direction: 1 | -1, url: string | null) => {
        if (!url) return;
        const currentPage = parseInt(searchParams.get("page") || "1");
        applyFilters({ page: currentPage + direction });
    };

    const [isAddOpen, setIsAddOpen] = useState(false);

    const openAddModal = () => {
        setIsAddOpen(true);
    };



    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };


    const getMonthName = (monthNumber: string | number) => {
        const date = new Date();
        date.setMonth(parseInt(monthNumber as string) - 1);
        return date.toLocaleString("id-ID", { month: "long" });
    };

    const isBendaharaOrAdmin =
        authUser?.role === "bendahara" || authUser?.role === "super_admin";
    const isSuperAdmin = authUser?.role === "super_admin";

    const [hijriDate, setHijriDate] = useState<string>("");

    const getHijriDateString = () => {
        try {
            const date = new Date();
            const format = new Intl.DateTimeFormat("id-TN-u-ca-islamic", {
                day: "numeric",
                month: "long",
                year: "numeric",
            }).format(date);
            return format.replace(/ H$/i, "") + " H";
        } catch (e) {
            return "Tanggal Hijriyah";
        }
    };

    useEffect(() => {
        setHijriDate(getHijriDateString());
    }, []);

    const masehiDateStr = dayjs().format("dddd, D MMMM YYYY");

    const handleDelete = (id: string) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        if (confirmDeleteId) {
            try {
                await remove.mutateAsync(confirmDeleteId);
            } finally {
                setConfirmDeleteId(null);
            }
        }
    };

    const handleVerify = (id: string) => {
        setConfirmVerifyId(id);
    };

    const confirmVerify = async () => {
        if (confirmVerifyId) {
            try {
                await verify.mutateAsync(confirmVerifyId);
            } finally {
                setConfirmVerifyId(null);
            }
        }
    };

    const formatCat = (cat: string) => {
        if (!cat) return "-";
        const withSpaces = cat.replace(/_/g, " ");
        return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
    };

    return (
        <AppLayout title="Pengelola Kas">
            <div className="flex flex-1 min-h-0 flex-col">
                {/* Header Section */}
                <PageHeader
                    title="Kas Masjid"
                    description="Kelola dan pantau seluruh transaksi pemasukan dan pengeluaran keuangan masjid."
                    className="shrink-0"
                >
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">
                            {masehiDateStr}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {hijriDate}
                        </p>
                    </div>
                </PageHeader>

                {/* ── DESKTOP ONLY: Summary Cards + FilterBar + DataTable ── */}
                <div className="flex flex-1 min-h-0 flex-col">
                    <KasSummaryCards
                        totalSaldo={localSummary.saldo_total_kas}
                        pemasukanBulanIni={localSummary.pemasukan_bulan_ini}
                        pengeluaranBulanIni={localSummary.pengeluaran_bulan_ini}
                        surplusDefisit={localSummary.saldo_akhir_bulan}
                        monthLabel={getMonthName(month)}
                        loading={loadingSummary}
                        className="mb-8 md:px-6 shrink-0"
                    />

                    {/* Desktop Toolbar — search, filter, sort */}
                    <FilterBar
                        searchPlaceholder="Cari keterangan transaksi..."
                        searchValue={localSearch}
                        onSearchChange={(val) =>
                            handleSearchChange({
                                target: { value: val },
                            } as React.ChangeEvent<HTMLInputElement>)
                        }
                        addon={
                            <div className="flex items-center justify-start gap-1 p-1 bg-slate-100 rounded-xl">
                                {(
                                    [
                                        { value: "", label: "Semua" },
                                        { value: "in", label: "Masuk" },
                                        { value: "out", label: "Keluar" },
                                    ] as {
                                        value: "" | "in" | "out";
                                        label: string;
                                    }[]
                                ).map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleTypeChange(opt.value)}
                                        className={`relative flex-none px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors z-10 ${
                                            typeFilter === opt.value
                                                ? "text-green-700"
                                                : "text-slate-500 hover:text-slate-700"
                                        }`}
                                    >
                                        {typeFilter === opt.value && (
                                            <motion.div
                                                layoutId="activeFilterKasTab"
                                                className="absolute inset-0 bg-white border border-green-500 rounded-lg shadow-sm -z-10"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 400,
                                                    damping: 30,
                                                }}
                                            />
                                        )}
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        }
                    >
                        {/* Kategori Filter Dropdown */}
                        <div className="relative shrink-0 z-50">
                            {isCategoryFilterOpen && (
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsCategoryFilterOpen(false)}
                                ></div>
                            )}
                            <button
                                type="button"
                                onClick={() =>
                                    setIsCategoryFilterOpen(!isCategoryFilterOpen)
                                }
                                className="relative z-50 inline-flex items-center justify-between w-[200px] px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-2xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                            >
                                <Filter className="w-4 h-4 mr-2 text-slate-500 shrink-0" />
                                <span className="truncate flex-1 text-left">
                                    {ALL_CATEGORY_OPTIONS.find(
                                        (opt) => opt.value === categoryFilter,
                                    )?.label || "Semua Kategori"}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ml-2 shrink-0 ${isCategoryFilterOpen ? "rotate-180" : ""}`}
                                />
                            </button>
                            <AnimatePresence>
                                {isCategoryFilterOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-[60] p-1"
                                    >
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {(typeFilter === "in" ? [{ value: "", label: "Semua Kategori" }, ...CATEGORY_OPTIONS_IN] : typeFilter === "out" ? [{ value: "", label: "Semua Kategori" }, ...CATEGORY_OPTIONS_OUT] : ALL_CATEGORY_OPTIONS).map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() =>
                                                        handleCategoryChange(
                                                            opt.value,
                                                        )
                                                    }
                                                    className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                                                        categoryFilter === opt.value
                                                            ? "bg-green-50 text-green-700 font-semibold"
                                                            : "text-slate-600 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {/* Urutkan & Catat Transaksi */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    const newSort =
                                        sortOrder === "terbaru" ? "terlama" : "terbaru";
                                    applyFilters({ sort: newSort, page: 1 });
                                }}
                                className="inline-flex items-center justify-center w-auto px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer shrink-0"
                            >
                                <SlidersHorizontal className="w-4 h-4 mr-2 text-slate-500" />
                                {sortOrder === "terbaru" ? "Terbaru" : "Terlama"}
                            </button>

                            {isBendaharaOrAdmin && (
                                <>
                                    <div className="h-6 w-px bg-slate-300 mx-1"></div>
                                    <button
                                        onClick={openAddModal}
                                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-sm shadow-sm flex items-center justify-center cursor-pointer shrink-0"
                                    >
                                        Catat Transaksi
                                    </button>
                                </>
                            )}
                        </div>
                    </FilterBar>

                    <div className="flex flex-1 min-h-0 flex-col gap-2">
                        <DataTable
                            className="flex flex-1 min-h-0"
                            tableFixed
                            loading={loadingKas}
                            isFetching={fetchingKas}
                            columns={
                                [
                            {
                                key: "tanggal",
                                header: "Tanggal",
                                width: "w-[13%]",
                                cellClassName:
                                    "whitespace-nowrap text-slate-600 font-medium text-sm",
                                render: (item) => (
                                    <>
                                        <div>
                                            {new Date(
                                                item.created_at,
                                            ).toLocaleDateString("id-ID", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            {new Date(
                                                item.created_at,
                                            ).toLocaleTimeString("id-ID", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                    </>
                                ),
                            },
                            {
                                key: "pengimput",
                                header: "Pengimput",
                                width: "w-[16%]",
                                cellClassName: "whitespace-nowrap",
                                render: (item) => (
                                    <span className="text-sm text-slate-700 font-medium">
                                        {item.user?.name ?? "-"}
                                    </span>
                                ),
                            },
                            {
                                key: "kategori",
                                header: "Kategori",
                                width: "w-[12%]",
                                render: (item) => (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 capitalize border border-slate-200">
                                        {item.category?.replace(/_/g, " ") || "-"}
                                    </span>
                                ),
                            },
                            {
                                key: "metode",
                                header: "Metode",
                                width: "w-[10%]",
                                cellClassName:
                                    "capitalize text-slate-600 text-sm",
                                render: (item) => item.payment_method || "-",
                            },
                            {
                                key: "nominal",
                                header: "Nominal",
                                width: "w-[15%]",
                                cellClassName: (item) =>
                                    `whitespace-nowrap font-bold text-sm ${
                                        item.type === "in"
                                            ? "text-green-600"
                                            : "text-red-500"
                                    }`,
                                render: (item) =>
                                    `${item.type === "in" ? "+" : "-"} ${formatRupiah(item.amount)}`,
                            },
                            {
                                key: "keterangan",
                                header: "Keterangan",
                                width: "w-[24%]",
                                render: (item) => (
                                    <p className="text-slate-600 text-sm whitespace-normal break-words">
                                        {item.notes || "-"}
                                    </p>
                                ),
                            },
                            {
                                key: "status",
                                header: "Status",
                                width: "w-[12%]",
                                cellClassName: "whitespace-nowrap",
                                render: (item) =>
                                    item.verified_at ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200/50">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Terverifikasi
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                                            Pending
                                        </span>
                                    ),
                            },
                            {
                                key: "aksi",
                                header: "Aksi",
                                width: "w-[10%]",
                                cellClassName: "whitespace-nowrap text-sm",
                                render: (item) => (
                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isBendaharaOrAdmin &&
                                            !item.verified_at && (
                                                <button
                                                    onClick={() =>
                                                        handleVerify(item.id)
                                                    }
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Verifikasi Transaksi"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                        {isSuperAdmin && (
                                            <button
                                                onClick={() =>
                                                    handleDelete(item.id)
                                                }
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Hapus Transaksi"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ),
                            },
                                ] satisfies ColumnDef<(typeof localTransactions)[0]>[]
                            }
                            data={localTransactions}
                            keyExtractor={(item) => item.id}
                            emptyState={
                                <div className="flex flex-col items-center justify-center text-slate-400 py-2">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                        <Search className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="font-bold text-slate-800">
                                        Belum ada data transaksi
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Transaksi yang ditambahkan akan muncul di sini.
                                    </p>
                                </div>
                            }
                        />

                        <div className="mt-auto flex shrink-0 flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm sm:flex-row">
                            {/* Info */}
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

                            {/* Prev / Page Numbers / Next */}
                            <div className="flex items-center gap-1.5">
                                {/* Prev */}
                                <button
                                    type="button"
                                    disabled={!transactions.prev_page_url}
                                    onClick={() =>
                                        handlePageNav(-1, transactions.prev_page_url)
                                    }
                                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {/* Page numbers */}
                                <AnimatePresence mode="popLayout">
                                    {[
                                        transactions.current_page - 1,
                                        transactions.current_page,
                                        transactions.current_page + 1,
                                    ]
                                        .filter(
                                            (p) =>
                                                p >= 1 && p <= transactions.last_page,
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
                                                    if (p === transactions.current_page) return;
                                                    applyFilters({ page: p });
                                                }}
                                                className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${
                                                    p === transactions.current_page
                                                        ? "bg-green-600 text-white border-green-600 cursor-default"
                                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                {p}
                                            </motion.button>
                                        ))}
                                </AnimatePresence>

                                {/* Next */}
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
                    </div>
                </div>
            </div>

            <KasFormPanel isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={confirmDelete}
                title="Hapus Transaksi Kas?"
                variant="danger"
            >
                Apakah Anda yakin ingin menghapus transaksi ini? Saldo kas akan otomatis disesuaikan.
            </ConfirmDialog>

            <ConfirmDialog
                isOpen={!!confirmVerifyId}
                onClose={() => setConfirmVerifyId(null)}
                onConfirm={confirmVerify}
                title="Verifikasi Transaksi?"
                variant="primary"
            >
                Apakah Anda sudah memastikan data transaksi ini valid?
            </ConfirmDialog>
        </AppLayout>
    );
}
