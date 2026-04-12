import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import { PaginatedResponse, Transaction, User } from "@/types";
import { formatRupiah, parseRupiah } from "@/utils/formatter";
import { useNetwork } from "@/hooks/useNetwork";
import api from "@/lib/api";
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
import FormActions from "@/components/FormActions";
import DataTable, { ColumnDef } from "@/components/DataTable";
import PrimaryButton from "@/components/PrimaryButton";
import CustomSelect from "@/components/CustomSelect";
import RupiahInput from "@/components/RupiahInput";

const CATEGORY_OPTIONS = [
    { value: "", label: "Semua Kategori" },
    { value: "zakat_fitrah", label: "Zakat Fitrah" },
    { value: "zakat_maal", label: "Zakat Maal" },
    { value: "infaq", label: "Infaq / Sedekah" },
    { value: "infaq_tromol", label: "Infaq Tromol" },
    { value: "operasional", label: "Operasional" },
    { value: "gaji", label: "Gaji" },
    { value: "lainnya", label: "Lainnya" },
];



interface BreakdownItem {
    category: string;
    total: number;
}

interface Props {
    transactions?: PaginatedResponse<Transaction>;
    auth?: {
        user: User;
    };
    filters?: {
        type?: string;
        category?: string;
        search?: string;
        sort?: string;
    };
    summary?: {
        pemasukan_bulan_ini: number;
        pengeluaran_bulan_ini: number;
        saldo_akhir_bulan: number;
        saldo_total_kas: number;
    };
    breakdown?: {
        pemasukan: BreakdownItem[];
        pengeluaran: BreakdownItem[];
    };
    month?: string | number;
    year?: string | number;
}

const EMPTY_TRANSACTIONS: PaginatedResponse<Transaction> = { data: [], links: [], from: 0, to: 0, total: 0, current_page: 1, last_page: 1, prev_page_url: null, next_page_url: null };
const EMPTY_SUMMARY = { pemasukan_bulan_ini: 0, pengeluaran_bulan_ini: 0, saldo_akhir_bulan: 0, saldo_total_kas: 0 };
const EMPTY_BREAKDOWN = { pemasukan: [], pengeluaran: [] };

// Module-level cache: data tetap ada saat navigasi antar halaman
let kasTransactionsCache: Transaction[] = [];
let kasSummaryCache = { ...EMPTY_SUMMARY };
let kasCacheReady = false;

export default function KasIndex({
    transactions: transactionsProp,
    auth: authProp,
    summary: summaryProp,
    breakdown: breakdownProp,
    month = new Date().getMonth() + 1,
    year = new Date().getFullYear(),
    filters,
}: Props) {
    const { user: authUser } = useAuth();
    const transactions = transactionsProp ?? EMPTY_TRANSACTIONS;
    const auth = authProp ?? { user: authUser ?? { id: '', name: 'Admin', role: 'super_admin' } as User };
    const summary = summaryProp ?? EMPTY_SUMMARY;
    const breakdown = breakdownProp ?? EMPTY_BREAKDOWN;
    // Gunakan cache sebagai initial state — tampil instan saat navigasi kembali
    const [localTransactions, setLocalTransactions] = useState<Transaction[]>(kasCacheReady ? kasTransactionsCache : transactions.data);
    const [localSummary, setLocalSummary] = useState(kasCacheReady ? kasSummaryCache : summary);
    const [activeTab, setActiveTab] = useState<"tampilan" | "catat">(
        "tampilan",
    );
    const [search, setSearch] = useState(filters?.search ?? "");
    const [typeFilter, setTypeFilter] = useState(filters?.type ?? "");
    const [categoryFilter, setCategoryFilter] = useState(
        filters?.category ?? "",
    );
    const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
    const [sortOrder, setSortOrder] = useState<"terbaru" | "terlama">(
        filters?.sort === "terlama" ? "terlama" : "terbaru",
    );
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

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

    const [page, setPage] = useState(1);
    const [allTransactions, setAllTransactions] = useState(transactions.data);
    const [hasMore, setHasMore] = useState(transactions.next_page_url !== null);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    // Load data dari API saat pertama kali mount dan saat filter berubah
    const fetchKas = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (typeFilter) params.set("type", typeFilter);
            if (categoryFilter) params.set("category", categoryFilter);
            params.set("sort", sortOrder === "terlama" ? "terlama" : "terbaru");

            const res = await api.get(`/kas?${params.toString()}`);
            const resData = res.data?.data;

            if (resData?.transactions?.items) {
                kasTransactionsCache = resData.transactions.items;
                setLocalTransactions(resData.transactions.items);
            }
            if (resData?.summary) {
                kasSummaryCache = resData.summary;
                kasCacheReady = true;
                setLocalSummary(resData.summary);
            }
        } catch (err) {
            console.error("Gagal memuat data kas:", err);
        }
    }, [search, typeFilter, categoryFilter, sortOrder]);

    useEffect(() => {
        fetchKas();
    }, [fetchKas]);

    // Reset list saat transactions props berganti (akibat search atau filter diubah dan kembali ke page 1)
    useEffect(() => {
        if (transactions.current_page === 1) {
            setAllTransactions(transactions.data);
            setPage(1);
            setHasMore(transactions.next_page_url !== null);
        }
    }, [transactions]);

    const loadMore = useCallback(async () => {
        if (!hasMore) return;
        // TODO: implement standard fetch API for loadMore
        // Example: const res = await fetch(`/api/kas?page=${page + 1}&search=${search}...`);
        // if success, update allTransactions and page
    }, [page, hasMore]);

    // IntersectionObserver untuk deteksi scroll ke bawah
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    loadMore();
                }
            },
            { threshold: 0.1 },
        );

        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            applyFilters({ search: val, page: 1 });
        }, 350);
    };

    const handleTypeChange = (newType: string) => {
        setTypeFilter(newType);
        applyFilters({ type: newType, page: 1 });
    };

    const handleCategoryChange = (val: string) => {
        setCategoryFilter(val);
        setIsCategoryFilterOpen(false);
        applyFilters({ category: val, page: 1 });
    };

    const handlePageNav = (direction: 1 | -1, url: string | null) => {
        if (!url) return;
        // In SPA, parse url and update search params
        const newUrl = new URL(url);
        setSearchParams(new URLSearchParams(newUrl.search));
    };

    const [isAddOpen, setIsAddOpen] = useState(false);
    const isOnline = useNetwork();

    const [formData, setFormDataForm] = useState({
        type: "in" as "in" | "out",
        category: "infaq",
        amount: 0,
        payment_method: "tunai",
        notes: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const setFormData = (key: string, value: any) => setFormDataForm(prev => ({ ...prev, [key]: value }));
    const setError = (key: string, msg: string) => setErrors(prev => ({ ...prev, [key]: msg }));
    const clearErrors = (...keys: string[]) => setErrors(prev => {
        const next = { ...prev };
        keys.length ? keys.forEach(k => delete next[k]) : Object.keys(next).forEach(k => delete next[k]);
        return next;
    });
    const reset = () => setFormDataForm({ type: "in", category: "infaq", amount: 0, payment_method: "tunai", notes: "" });

    const openAddModal = () => {
        reset();
        clearErrors();
        setIsAddOpen(true);
    };

    const closeAddModal = () => {
        setIsAddOpen(false);
        setTimeout(() => reset(), 200);
    };

    const handleAmountChange = (numberVal: number) => {
        setFormData("amount", numberVal);
        if (numberVal > 999999999) {
            setError("amount", "Nominal maks Rp. 999.999.999");
        } else {
            clearErrors("amount");
        }
    };

    const submitAdd = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.amount <= 0) {
            setError("amount", "Nominal harus lebih dari 0");
            return;
        }

        setProcessing(true);
        try {
            await api.post("/kas", {
                type: formData.type,           // backend: 'in' | 'out'
                category: formData.category,
                amount: formData.amount,
                payment_method: formData.payment_method,
                notes: formData.notes,         // backend field: notes
            });
            closeAddModal();
            reset();
            await fetchKas(); // Refresh data setelah tambah
        } catch (error: any) {
            const errData = error?.response?.data;
            if (errData?.errors) {
                Object.entries(errData.errors).forEach(([key, msgs]) =>
                    setError(key, (msgs as string[])[0])
                );
            } else {
                setError("amount", errData?.message ?? "Gagal menyimpan transaksi.");
            }
        } finally {
            setProcessing(false);
        }
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
        auth.user.role === "bendahara" || auth.user.role === "super_admin";
    const isSuperAdmin = auth.user.role === "super_admin";

    const handleDelete = async (id: string) => {
        if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
            try {
                await api.delete(`/kas/${id}`);
                await fetchKas();
            } catch (err) {
                console.error("Gagal menghapus:", err);
            }
        }
    };

    const handleVerify = async (id: string) => {
        if (confirm("Verifikasi transaksi ini?")) {
            try {
                await api.put(`/kas/${id}/verify`);
                await fetchKas();
            } catch (err) {
                console.error("Gagal memverifikasi:", err);
            }
        }
    };

    const formatCat = (cat: string) => {
        const withSpaces = cat.replace(/_/g, " ");
        return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
    };

    return (
        <AppLayout title="Pengelola Kas">

            {/* ── DESKTOP ONLY: Summary Cards + FilterBar + DataTable ── */}
            <div className="flex flex-col flex-1 min-h-[500px]">
                <KasSummaryCards
                    totalSaldo={localSummary.saldo_total_kas}
                    pemasukanBulanIni={localSummary.pemasukan_bulan_ini}
                    pengeluaranBulanIni={localSummary.pengeluaran_bulan_ini}
                    surplusDefisit={localSummary.saldo_akhir_bulan}
                    monthLabel={getMonthName(month)}
                    className="mb-8 md:px-6 shrink-0"
                />

                {/* Separator + Catat Transaksi button — Bendahara/Admin only */}
                <div className="flex items-center gap-4 mb-6 md:mx-6">
                    <div className="flex-1 border-t border-slate-200" />
                    {isBendaharaOrAdmin && (
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-semibold rounded-full shadow-md shadow-emerald-500/25 transition-all shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            Catat Transaksi
                        </button>
                    )}
                </div>

                {/* Desktop Toolbar — search, filter, sort */}
                <FilterBar
                    searchPlaceholder="Cari keterangan transaksi..."
                    searchValue={search}
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
                            className="relative z-50 inline-flex items-center justify-between w-[200px] px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                        >
                            <Filter className="w-4 h-4 mr-2 text-slate-500 shrink-0" />
                            <span className="truncate flex-1 text-left">
                                {CATEGORY_OPTIONS.find(
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
                                        {CATEGORY_OPTIONS.map((opt) => (
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
                    {/* Urutkan */}
                    <button
                        type="button"
                        onClick={() => {
                            const newSort =
                                sortOrder === "terbaru" ? "terlama" : "terbaru";
                            setSortOrder(newSort);
                            applyFilters({ sort: newSort, page: 1 });
                        }}
                        className="inline-flex items-center justify-center w-auto px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer shrink-0"
                    >
                        <SlidersHorizontal className="w-4 h-4 mr-2 text-slate-500" />
                        {sortOrder === "terbaru" ? "Terbaru" : "Terlama"}
                    </button>
                    {/* Desktop: Filter & Download buttons */}
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                        <SlidersHorizontal size={15} />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                        <Download size={15} />
                        Download
                    </button>
                </FilterBar>

                <DataTable
                    className="flex flex-1 min-h-[400px]"
                    tableFixed
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
                                        {item.category.replace(/_/g, " ")}
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
                        ] satisfies ColumnDef<(typeof transactions.data)[0]>[]
                    }
                    data={localTransactions}
                    keyExtractor={(row) => row.id}
                    emptyState={
                        <div className="flex flex-col items-center justify-center text-slate-400 py-2">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="font-medium text-slate-600">
                                Belum ada data transaksi
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                Transaksi yang ditambahkan akan muncul di sini.
                            </p>
                        </div>
                    }
                />
            </div>
            {/* end contents */}

            {/* Pagination Desktop - Muncul dinamis hanya jika lebih dari 1 halaman */}
            {transactions.last_page > 1 && (
                <div className="flex px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex-col flex-row items-center justify-between gap-3 mt-2 shrink-0">
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
                                            if (p === transactions.current_page)
                                                return;
                                            handlePageNav(
                                                p > transactions.current_page
                                                    ? 1
                                                    : -1,
                                                p > transactions.current_page
                                                    ? transactions.next_page_url
                                                    : transactions.prev_page_url,
                                            );
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
            )}

            <AnimatePresence>
                {isAddOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
                            onClick={closeAddModal}
                        ></motion.div>

                        <motion.div
                            initial={
                                isMobile
                                    ? { y: "100%", opacity: 0 }
                                    : { opacity: 0, scale: 0.95, y: 16 }
                            }
                            animate={
                                isMobile
                                    ? { y: 0, opacity: 1 }
                                    : { opacity: 1, scale: 1, y: 0 }
                            }
                            exit={
                                isMobile
                                    ? { y: "100%", opacity: 0 }
                                    : { opacity: 0, scale: 0.95, y: 16 }
                            }
                            transition={{
                                type: "spring",
                                bounce: 0,
                                duration: 0.4,
                            }}
                            className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[95vh] sm:h-auto sm:max-h-[80vh]"
                        >

                            <div className="px-5 sm:px-6 py-4 pt-8 sm:pt-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Catat Transaksi
                                </h3>
                                <button
                                    onClick={closeAddModal}
                                    className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-5 sm:p-6 pb-safe flex-1 overflow-y-auto bg-white min-h-0">
                                <form
                                    id="kas-form"
                                    onSubmit={submitAdd}
                                    className="space-y-4 sm:space-y-5"
                                >
                                    {/* Type Selection */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Jenis Transaksi *
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData("type", "in")
                                                }
                                                className={`py-2.5 px-4 rounded-xl border text-sm font-medium flex items-center justify-center transition-all ${formData.type === "in" ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                                            >
                                                Pemasukan (+In)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData("type", "out")
                                                }
                                                className={`py-2.5 px-4 rounded-xl border text-sm font-medium flex items-center justify-center transition-all ${formData.type === "out" ? "bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                                            >
                                                Pengeluaran (-Out)
                                            </button>
                                        </div>
                                        {errors.type && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.type}
                                            </p>
                                        )}
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Kategori *
                                        </label>
                                        <CustomSelect
                                            value={formData.category}
                                            onChange={(val) =>
                                                setFormData("category", val)
                                            }
                                            options={CATEGORY_OPTIONS.filter(
                                                (opt) => opt.value !== "",
                                            )}
                                        />
                                        {errors.category && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.category}
                                            </p>
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label
                                            className={`block text-sm font-semibold mb-1.5 ${errors.amount ? "text-red-500" : "text-slate-700"}`}
                                        >
                                            Nominal (Rp) *
                                        </label>
                                        <RupiahInput
                                            value={formData.amount}
                                            onValueChange={handleAmountChange}
                                            isError={!!errors.amount}
                                        />
                                        <div className="flex justify-between items-start mt-1">
                                            {errors.amount ? (
                                                <p className="text-xs text-red-500">
                                                    {errors.amount}
                                                </p>
                                            ) : (
                                                <div></div>
                                            )}
                                            <p
                                                className={`text-xs font-medium ${errors.amount ? "text-red-500" : "text-slate-400"}`}
                                            >
                                                *maks Rp. 999.999.999
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Metode Pembayaran
                                        </label>
                                        <CustomSelect
                                            value={formData.payment_method}
                                            onChange={(val) =>
                                                setFormData(
                                                    "payment_method",
                                                    val,
                                                )
                                            }
                                            options={[
                                                {
                                                    value: "tunai",
                                                    label: "Tunai",
                                                },
                                                {
                                                    value: "transfer",
                                                    label: "Transfer Bank",
                                                },
                                                {
                                                    value: "qris",
                                                    label: "QRIS",
                                                },
                                            ]}
                                        />
                                        {errors.payment_method && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.payment_method}
                                            </p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Keterangan *
                                        </label>
                                        <textarea
                                            required
                                            value={formData.notes}
                                            onChange={(e) => {
                                                // Sanitize input: Remove potential XSS characters like < > [ ] { }
                                                const sanitizedValue =
                                                    e.target.value.replace(
                                                        /[<>()[\]{}]/g,
                                                        "",
                                                    );
                                                setFormData(
                                                    "notes",
                                                    sanitizedValue,
                                                );
                                            }}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm shadow-sm resize-none"
                                            rows={3}
                                            placeholder="Contoh: Infaq Hamba Allah, Bayar Listrik Bulan Juni"
                                        ></textarea>
                                        {errors.notes && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.notes}
                                            </p>
                                        )}
                                    </div>
                                </form>
                            </div>
                            <div className="p-5 sm:p-6 border-t border-slate-100 shrink-0 bg-white pb-safe">
                                <FormActions
                                    onCancel={closeAddModal}
                                    processing={processing}
                                    submitDisabled={!isOnline}
                                    layout="full-width"
                                    submitText="Simpan Transaksi"
                                    formId="kas-form"
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
