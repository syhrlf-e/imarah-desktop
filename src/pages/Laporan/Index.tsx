import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import {
    PieChart,
    Building,
    TrendingDown,
    TrendingUp,
    CalendarDays,
} from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

interface SummaryData {
    pemasukan_bulan_ini: number;
    pengeluaran_bulan_ini: number;
    saldo_akhir_bulan: number;
    saldo_total_kas: number;
}

interface BreakdownItem {
    category: string;
    total: number;
}

interface ReportProps {
    month?: string | number;
    year?: string | number;
    summary?: SummaryData;
    breakdown?: {
        pemasukan: BreakdownItem[];
        pengeluaran: BreakdownItem[];
    };
}

const now = new Date();
const DEFAULT_SUMMARY: SummaryData = { pemasukan_bulan_ini: 0, pengeluaran_bulan_ini: 0, saldo_akhir_bulan: 0, saldo_total_kas: 0 };
const DEFAULT_BREAKDOWN = { pemasukan: [] as BreakdownItem[], pengeluaran: [] as BreakdownItem[] };

export default function LaporanIndex() {
    const [selectedMonth, setSelectedMonth] = useState(
        (now.getMonth() + 1).toString().padStart(2, "0"),
    );
    const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
    const [summary, setSummary] = useState<SummaryData>(DEFAULT_SUMMARY);
    const [breakdown, setBreakdown] = useState(DEFAULT_BREAKDOWN);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const [searchParams, setSearchParams] = useSearchParams();

    const fetchLaporan = (month: string, year: string) => {
        setLoading(true);
        api.get(`/laporan?month=${month}&year=${year}`)
            .then(res => {
                const d = res.data?.data;
                if (d?.summary) setSummary(d.summary);
                if (d?.breakdown) setBreakdown(d.breakdown);
            })
            .catch(err => console.error('Gagal memuat laporan:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchLaporan(selectedMonth, selectedYear);
    }, []);

    const handleFilter = () => {
        setSearchParams({ month: selectedMonth, year: selectedYear });
        fetchLaporan(selectedMonth, selectedYear);
    };

    const formatCat = (cat: string) => {
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

    return (
        <AppLayout title="Pengelola Laporan">
            {/* Header Section */}
            <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:px-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                        Laporan Keuangan
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Ringkasan operasional dan posisi kas masjid untuk
                        periode tertentu.
                    </p>
                </div>

                {/* Filter Controls */}
                <div className="mb-2 relative z-10 flex flex-col flex-row items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <div className="relative flex-1 flex-none">
                            <CustomSelect
                                value={selectedMonth}
                                onChange={(val) => setSelectedMonth(val)}
                                className="w-full sm:w-40 bg-slate-50"
                                options={[...Array(12)].map((_, i) => ({
                                    value: (i + 1).toString().padStart(2, "0"),
                                    label: new Date(0, i).toLocaleString(
                                        "id-ID",
                                        { month: "long" },
                                    ),
                                }))}
                            />
                        </div>
                        <div className="relative flex-1 flex-none">
                            <CustomSelect
                                value={selectedYear}
                                onChange={(val) => setSelectedYear(val)}
                                className="w-full sm:w-32 bg-slate-50"
                                options={years.map((y) => ({
                                    value: y.toString(),
                                    label: y.toString(),
                                }))}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleFilter}
                        className="w-full sm:w-auto px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium text-sm shadow-sm"
                    >
                        Terapkan
                    </button>
                </div>
            </div>

            {/* Breakdown Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pemasukan Breakdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 flex items-center text-lg">
                            <TrendingDown className="w-5 h-5 text-emerald-500 mr-2.5" />
                            Rincian Pemasukan
                        </h4>
                        <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                            {breakdown.pemasukan.length} Kategori
                        </span>
                    </div>
                    <div className="p-2 flex-1">
                        {breakdown.pemasukan.length > 0 ? (
                            <ul className="space-y-1">
                                {breakdown.pemasukan.map((item, idx) => (
                                    <li
                                        key={idx}
                                        className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3"></div>
                                            <span className="text-sm font-medium text-slate-700">
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
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                <PieChart className="w-12 h-12 text-slate-200 mb-3" />
                                <p className="text-slate-500 font-medium">
                                    Tidak ada data pemasukan
                                </p>
                                <p className="text-sm text-slate-400 mt-1">
                                    Belum ada transaksi di bulan ini.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pengeluaran Breakdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 flex items-center text-lg">
                            <TrendingUp className="w-5 h-5 text-red-500 mr-2.5" />
                            Rincian Pengeluaran
                        </h4>
                        <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                            {breakdown.pengeluaran.length} Kategori
                        </span>
                    </div>
                    <div className="p-2 flex-1">
                        {breakdown.pengeluaran.length > 0 ? (
                            <ul className="space-y-1">
                                {breakdown.pengeluaran.map((item, idx) => (
                                    <li
                                        key={idx}
                                        className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-red-500 mr-3"></div>
                                            <span className="text-sm font-medium text-slate-700">
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
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                <Building className="w-12 h-12 text-slate-200 mb-3" />
                                <p className="text-slate-500 font-medium">
                                    Tidak ada data pengeluaran
                                </p>
                                <p className="text-sm text-slate-400 mt-1">
                                    Belum ada transaksi di bulan ini.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
