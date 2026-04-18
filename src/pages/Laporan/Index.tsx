import { useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { useSearchParams } from "react-router-dom";
import { useLaporan } from "@/hooks/api/useLaporan";
import { laporanService, LaporanBreakdownItem } from "@/services/laporanService";
import {
    PieChart,
    Building,
    TrendingDown,
    TrendingUp,
    Download,
    FileSpreadsheet
} from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import KasSummaryCards from "@/components/KasSummaryCards";
import ErrorState from "@/components/ErrorState";
import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend
} from "recharts";
import { toast } from "@/components/Toast";

const now = new Date();
const DEFAULT_SUMMARY = { pemasukan_bulan_ini: 0, pengeluaran_bulan_ini: 0, saldo_akhir_bulan: 0, saldo_total_kas: 0 };
const DEFAULT_BREAKDOWN = { pemasukan: [] as LaporanBreakdownItem[], pengeluaran: [] as LaporanBreakdownItem[] };

export default function LaporanIndex() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [selectedMonth, setSelectedMonth] = useState(
        searchParams.get("month") || (now.getMonth() + 1).toString().padStart(2, "0")
    );
    const [selectedYear, setSelectedYear] = useState(
        searchParams.get("year") || now.getFullYear().toString()
    );

    const [exporting, setExporting] = useState(false);

    // TanStack Query — automatic caching, deduping, and error handling
    const { data, isLoading, isError, error } = useLaporan(selectedMonth, selectedYear);

    const summary = data?.summary ?? DEFAULT_SUMMARY;
    const breakdown = data?.breakdown ?? DEFAULT_BREAKDOWN;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const handleFilter = () => {
        setSearchParams({ month: selectedMonth, year: selectedYear });
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const savedPath = await laporanService.exportLaporan(selectedMonth, selectedYear);
            if (savedPath) {
                toast.success(`Laporan berhasil disimpan di: ${savedPath}`);
            }
        } catch (e: any) {
            if (e !== "Export dibatalkan") {
                toast.error("Gagal mengunduh laporan. Pastikan Anda memiliki akses.");
            }
        } finally {
            setExporting(false);
        }
    };

    const formatCat = (cat: string) => {
        if (!cat) return "-";
        const withSpaces = cat.replace(/_/g, " ");
        return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const getMonthName = (monthNumber: string) => {
        const date = new Date();
        date.setMonth(parseInt(monthNumber) - 1);
        return date.toLocaleString("id-ID", { month: "long" });
    };

    // Pie Chart Data
    const pieData = [
        { name: "Pemasukan", value: Number(summary.pemasukan_bulan_ini), color: "#10b981" },
        { name: "Pengeluaran", value: Number(summary.pengeluaran_bulan_ini), color: "#ef4444" },
    ];

    const hasChartData = pieData[0].value > 0 || pieData[1].value > 0;

    const renderCustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xl border border-slate-700">
                    {data.name}: {formatCurrency(data.value)}
                </div>
            );
        }
        return null;
    };

    // ── Error State (403, 500, network) ────────────────────────
    if (isError) {
        const isForbidden = (error as any)?.response?.status === 403;
        return (
            <AppLayout title="Laporan Keuangan">
                <div className="flex-1 flex items-center justify-center">
                    <ErrorState
                        title={isForbidden ? "Akses Ditolak" : undefined}
                        message={
                            isForbidden
                                ? "Anda tidak memiliki izin untuk melihat laporan ini. Hubungi administrator jika Anda merasa ini adalah kesalahan."
                                : "Terjadi kesalahan saat memuat data. Periksa koneksi Anda dan coba lagi."
                        }
                        onRetry={() => window.location.reload()}
                    />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Laporan Keuangan">
            {/* Header Section */}
            <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:px-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                        Laporan Keuangan
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Ringkasan operasional dan analitik keuangan masjid.
                    </p>
                </div>

                {/* Filter & Aksi Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center space-x-2 bg-white p-1.5 rounded-3xl shadow-sm border border-slate-200">
                        <div className="relative">
                            <CustomSelect
                                value={selectedMonth}
                                onChange={(val) => setSelectedMonth(val)}
                                className="w-36 bg-slate-50 border-none shadow-none focus:ring-0"
                                options={[...Array(12)].map((_, i) => ({
                                    value: (i + 1).toString().padStart(2, "0"),
                                    label: new Date(0, i).toLocaleString("id-ID", { month: "long" }),
                                }))}
                            />
                        </div>
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        <div className="relative">
                            <CustomSelect
                                value={selectedYear}
                                onChange={(val) => setSelectedYear(val)}
                                className="w-28 bg-slate-50 border-none shadow-none focus:ring-0"
                                options={years.map((y) => ({
                                    value: y.toString(),
                                    label: y.toString(),
                                }))}
                            />
                        </div>
                        <button
                            onClick={handleFilter}
                            className="ml-1 px-5 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all duration-200 font-bold text-sm shadow-md active:scale-[0.98] cursor-pointer"
                        >
                            Cari
                        </button>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all duration-200 font-bold text-sm shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
                    >
                        {exporting ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            <FileSpreadsheet className="w-4 h-4" />
                        )}
                        {exporting ? "Memproses..." : "Unduh Laporan Excel"}
                    </button>
                </div>
            </div>

            {/* Baris 1: Summary Cards (Menampilkan 4 Kotak) */}
            <div className="mb-8">
                <KasSummaryCards
                    totalSaldo={summary.saldo_total_kas}
                    pemasukanBulanIni={summary.pemasukan_bulan_ini}
                    pengeluaranBulanIni={summary.pengeluaran_bulan_ini}
                    surplusDefisit={summary.saldo_akhir_bulan}
                    monthLabel={getMonthName(selectedMonth)}
                    loading={isLoading}
                />
            </div>

            {/* Baris 2: Visualisasi Grafik & Rincian */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Kolom Kiri: Chart (Porsi 1/3) */}
                <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col p-6">
                    <h4 className="font-bold text-slate-800 text-lg mb-1">
                        Porsi Keuangan
                    </h4>
                    <p className="text-sm text-slate-500 mb-6">
                        Perbandingan Pemasukan & Pengeluaran {getMonthName(selectedMonth)}.
                    </p>
                    
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[250px]">
                        {isLoading ? (
                            <div className="w-48 h-48 rounded-full border-8 border-slate-100 animate-pulse"></div>
                        ) : hasChartData ? (
                            <div className="w-full h-64">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <RechartsPieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip content={renderCustomTooltip} />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={36} 
                                            iconType="circle"
                                            formatter={(value) => <span className="text-slate-700 font-medium ml-1">{value}</span>}
                                        />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="text-center">
                                <PieChart className="w-16 h-16 text-slate-200 mx-auto mb-3" />
                                <p className="text-sm font-medium text-slate-500">Belum Ada Transaksi</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Kolom Kanan: Breakdown Pemasukan & Pengeluaran (Porsi 2/3) */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pemasukan Breakdown */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100 bg-emerald-50/30 flex items-center justify-between">
                            <h4 className="font-bold text-slate-800 flex items-center text-lg">
                                <TrendingDown className="w-5 h-5 text-emerald-500 mr-2.5" />
                                Rincian Pemasukan
                            </h4>
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-lg">
                                {breakdown.pemasukan.length} Kategori
                            </span>
                        </div>
                        <div className="p-3 flex-1 overflow-y-auto max-h-[300px]">
                            {isLoading ? (
                                <div className="p-4 space-y-3">
                                    {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>)}
                                </div>
                            ) : breakdown.pemasukan.length > 0 ? (
                                <ul className="space-y-1">
                                    {breakdown.pemasukan.map((item: LaporanBreakdownItem, idx: number) => (
                                        <li
                                            key={idx}
                                            className="flex justify-between items-center p-3 sm:p-4 hover:bg-slate-50 rounded-2xl transition-colors"
                                        >
                                            <div className="flex items-center">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-3 shadow-sm"></div>
                                                <span className="text-sm font-semibold text-slate-700">
                                                    {formatCat(item.category)}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-600">
                                                {formatCurrency(item.total)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-70">
                                    <PieChart className="w-10 h-10 text-slate-300 mb-3" />
                                    <p className="text-sm font-medium text-slate-500">Tidak ada pemasukan</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pengeluaran Breakdown */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100 bg-red-50/30 flex items-center justify-between">
                            <h4 className="font-bold text-slate-800 flex items-center text-lg">
                                <TrendingUp className="w-5 h-5 text-red-500 mr-2.5" />
                                Rincian Pengeluaran
                            </h4>
                            <span className="text-xs font-semibold text-red-700 bg-red-100/50 px-2.5 py-1 rounded-lg">
                                {breakdown.pengeluaran.length} Kategori
                            </span>
                        </div>
                        <div className="p-3 flex-1 overflow-y-auto max-h-[300px]">
                            {isLoading ? (
                                <div className="p-4 space-y-3">
                                    {[1,2].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>)}
                                </div>
                            ) : breakdown.pengeluaran.length > 0 ? (
                                <ul className="space-y-1">
                                    {breakdown.pengeluaran.map((item: LaporanBreakdownItem, idx: number) => (
                                        <li
                                            key={idx}
                                            className="flex justify-between items-center p-3 sm:p-4 hover:bg-slate-50 rounded-2xl transition-colors"
                                        >
                                            <div className="flex items-center">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-3 shadow-sm"></div>
                                                <span className="text-sm font-semibold text-slate-700">
                                                    {formatCat(item.category)}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-red-600">
                                                {formatCurrency(item.total)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-70">
                                    <Building className="w-10 h-10 text-slate-300 mb-3" />
                                    <p className="text-sm font-medium text-slate-500">Tidak ada pengeluaran</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
