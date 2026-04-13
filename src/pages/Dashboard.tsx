import { Link } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import { formatRupiah } from "@/utils/formatter";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    FileText,
} from "lucide-react";
import { useState, useEffect, Suspense, lazy } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import api from "@/lib/api";
import KasSummaryCards from "@/components/KasSummaryCards";
import { useAuth } from "@/contexts/AuthContext";
import UpcomingAgendas from "@/components/Dashboard/UpcomingAgendas";
import RecentTransactions from "@/components/Dashboard/RecentTransactions";
import { useQuery } from "@tanstack/react-query";

const FinancialChart = lazy(
    () => import("@/components/Dashboard/FinancialChart"),
);

dayjs.locale("id");

const EMPTY_DASHBOARD = {
    totalSaldo: 0, totalZakat: 0, totalTransaksiBulanIni: 0,
    pemasukanBulanIni: 0, pengeluaranBulanIni: 0,
    recentTransactions: [], upcomingAgendas: [], chartData: [],
    totalKasTransactions: 0, zakatStats: null, inventarisStats: null, tromolStats: null,
};

interface Transaction {
    id: number;
    category: string;
    type: "pemasukan" | "pengeluaran";
    amount: number;
    transaction_date: string;
    description: string;
}

interface Agenda {
    id: number;
    title: string;
    type: string;
    start_time: string;
    location: string;
    description?: string;
}

interface ChartData {
    name: string;
    pemasukan: number;
    pengeluaran: number;
}

interface ZakatStats {
    total_muzakki: number;
    total_mustahiq: number;
}

interface InventarisStats {
    total_items: number;
    good_items: number;
    broken_items: number;
}

interface TromolStats {
    total_boxes: number;
    active_boxes: number;
}

interface DashboardProps {
    auth: {
        user: {
            name: string;
            role: string;
        };
    };
    totalSaldo: number;
    totalZakat: number;
    totalTransaksiBulanIni: number;
    pemasukanBulanIni: number;
    pengeluaranBulanIni: number;
    recentTransactions: Transaction[];
    upcomingAgendas: Agenda[];
    chartData: ChartData[];
    totalKasTransactions: number;
    zakatStats: ZakatStats | null;
    inventarisStats: InventarisStats | null;
    tromolStats: TromolStats | null;
}

export default function Dashboard({
    totalSaldo: propTotalSaldo = 0,
    totalZakat: propTotalZakat = 0,
    totalTransaksiBulanIni: propTotalTransaksiBulanIni = 0,
    pemasukanBulanIni: propPemasukanBulanIni = 0,
    pengeluaranBulanIni: propPengeluaranBulanIni = 0,
    recentTransactions: propRecentTransactions = [],
    upcomingAgendas: propUpcomingAgendas = [],
    chartData: propChartData = [],
    totalKasTransactions: propTotalKasTransactions = 0,
    zakatStats: propZakatStats = null,
    inventarisStats: propInventarisStats = null,
    tromolStats: propTromolStats = null,
}: Partial<DashboardProps> = {}) {
    const { user: authUser } = useAuth();
    // Fallback jika data user belum dimuat atau field-nya kosong
    const auth = {
        user: {
            name: authUser?.name ?? 'Memuat...',
            role: authUser?.role ?? 'super_admin',
        },
    };

    const { data: dashboardData = EMPTY_DASHBOARD, isLoading: loading } = useQuery({
        queryKey: ["dashboard"],
        queryFn: async () => {
            const response = await api.get('/dashboard');
            if (response.data && response.data.data) {
                const resData = response.data.data;
                return {
                    totalSaldo: resData.total_saldo ?? 0,
                    totalZakat: resData.total_zakat ?? 0,
                    totalTransaksiBulanIni: resData.total_transaksi_bulan_ini ?? 0,
                    pemasukanBulanIni: resData.pemasukan_bulan_ini ?? 0,
                    pengeluaranBulanIni: resData.pengeluaran_bulan_ini ?? 0,
                    recentTransactions: resData.recent_transactions?.items ?? resData.recent_transactions ?? [],
                    upcomingAgendas: resData.upcoming_agendas?.items ?? resData.upcoming_agendas ?? [],
                    chartData: resData.chart_data ?? [],
                    totalKasTransactions: resData.stats?.kas_count ?? 0,
                    zakatStats: resData.stats?.zakat ?? null,
                    inventarisStats: resData.stats?.inventaris ?? null,
                    tromolStats: resData.stats?.tromol ?? null,
                };
            }
            return EMPTY_DASHBOARD;
        },
        staleTime: 1000 * 60 * 5, // 5 menit
    });

    // Destructure dari cache
    const {
        totalSaldo,
        totalZakat,
        totalTransaksiBulanIni,
        pemasukanBulanIni,
        pengeluaranBulanIni,
        recentTransactions,
        upcomingAgendas,
        chartData,
        totalKasTransactions,
        zakatStats,
        inventarisStats,
        tromolStats,
    } = dashboardData;

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

    return (
        <AppLayout title="Dashboard">
            <div className="flex flex-col flex-1 lg:min-h-0">

                {/* Desktop Greeting Header Section */}
                <div className="flex mb-6 flex-row items-center justify-between gap-4 shrink-0 px-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1">
                            Assalamu'alaikum, {auth.user.name}! 👋
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            sebagai{" "}
                            <span className="capitalize">
                                {auth.user.role.replace("_", " ")}
                            </span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">
                            {masehiDateStr}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {hijriDate}
                        </p>
                    </div>
                </div>

                {/* Main Layout Area */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-6 flex-1 lg:min-h-0">
                    {/* Left Section: Stats & Chart */}
                    <div className="lg:col-span-3 flex flex-col gap-3 md:gap-6 lg:min-h-0">
                        {/* Summary Zakat (Petugas Zakat) */}
                        {auth.user.role === "petugas_zakat" && (loading || zakatStats) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                                    <p className="text-slate-500 text-sm mb-1">
                                        Total Muzakki
                                    </p>
                                    {loading ? (
                                        <div className="h-8 w-24 bg-slate-100 rounded animate-pulse mt-1"></div>
                                    ) : (
                                        <p className="text-2xl font-bold text-slate-800">
                                            {zakatStats?.total_muzakki}{" "}
                                            <span className="text-sm font-normal text-slate-500">
                                                Orang
                                            </span>
                                        </p>
                                    )}
                                </div>
                                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                                    <p className="text-slate-500 text-sm mb-1">
                                        Total Mustahiq
                                    </p>
                                    {loading ? (
                                        <div className="h-8 w-24 bg-slate-100 rounded animate-pulse mt-1"></div>
                                    ) : (
                                        <p className="text-2xl font-bold text-slate-800">
                                            {zakatStats?.total_mustahiq}{" "}
                                            <span className="text-sm font-normal text-slate-500">
                                                Orang
                                            </span>
                                        </p>
                                    )}
                                </div>
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 bg-emerald-50">
                                    <p className="text-emerald-700 text-sm mb-1">
                                        Ringkasan Zakat Terkumpul
                                    </p>
                                    {loading ? (
                                        <div className="h-8 w-32 bg-emerald-100 rounded animate-pulse mt-1"></div>
                                    ) : (
                                        <p className="text-2xl font-bold text-emerald-800">
                                            {formatRupiah(totalZakat)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Summary Inventaris (Sekretaris) */}
                        {auth.user.role === "sekretaris" && (loading || inventarisStats) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                                    <p className="text-slate-500 text-sm mb-1">
                                        Total Item Inventaris
                                    </p>
                                    {loading ? (
                                        <div className="h-8 w-24 bg-slate-100 rounded animate-pulse mt-1"></div>
                                    ) : (
                                        <p className="text-2xl font-bold text-slate-800">
                                            {inventarisStats?.total_items}{" "}
                                            <span className="text-sm font-normal text-slate-500">
                                                Unit
                                            </span>
                                        </p>
                                    )}
                                </div>
                                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                                    <p className="text-emerald-700 text-sm mb-1">
                                        Kondisi Baik
                                    </p>
                                    {loading ? (
                                        <div className="h-8 w-24 bg-emerald-100 rounded animate-pulse mt-1"></div>
                                    ) : (
                                        <p className="text-2xl font-bold text-emerald-800">
                                            {inventarisStats?.good_items}{" "}
                                            <span className="text-sm font-normal text-emerald-700">
                                                Unit
                                            </span>
                                        </p>
                                    )}
                                </div>
                                <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                                    <p className="text-red-700 text-sm mb-1">
                                        Kondisi Rusak
                                    </p>
                                    {loading ? (
                                        <div className="h-8 w-24 bg-red-100 rounded animate-pulse mt-1"></div>
                                    ) : (
                                        <p className="text-2xl font-bold text-red-800">
                                            {inventarisStats?.broken_items}{" "}
                                            <span className="text-sm font-normal text-red-700">
                                                Unit
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Top Stats Grid Kas (Bendahara & Super Admin) */}
                        {["super_admin", "bendahara"].includes(
                            auth.user.role,
                        ) && (
                            <KasSummaryCards
                                totalSaldo={totalSaldo}
                                pemasukanBulanIni={pemasukanBulanIni}
                                pengeluaranBulanIni={pengeluaranBulanIni}
                                loading={loading}
                                className="shrink-0"
                            />
                        )}

                        {["super_admin", "bendahara"].includes(
                            auth.user.role,
                        ) && (
                            <Suspense
                                fallback={
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 h-[350px] flex items-center justify-center w-full">
                                        <div className="animate-pulse flex items-center text-sm font-medium text-slate-400">
                                            Memuat Rekapitulasi Grafik...
                                        </div>
                                    </div>
                                }
                            >
                                <FinancialChart
                                    data={chartData}
                                />
                            </Suspense>
                        )}
                    </div>

                    {/* Right Section: Agenda & Recent Transactions */}
                    <div className="lg:col-span-1 flex flex-col gap-3 md:gap-6 lg:min-h-0">
                        {/* Upcoming Agendas Widget */}
                        {["super_admin", "bendahara", "petugas_zakat", "sekretaris"].includes(
                            auth.user.role,
                        ) && (
                            <UpcomingAgendas />
                        )}

                        {/* Recent Transactions Widget (Super Admin & Bendahara) */}
                        {["super_admin", "bendahara"].includes(
                            auth.user.role,
                        ) && (
                            <RecentTransactions
                                transactions={recentTransactions}
                                totalCount={totalKasTransactions}
                                loading={loading}
                            />
                        )}
                    </div>
                </div>

                {/* Monthly Report Full-width Shortcut (Super Admin & Bendahara) */}
                {["super_admin", "bendahara"].includes(auth.user.role) && (
                    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 flex flex-col flex-row items-start sm:items-center justify-between gap-3 mt-3 md:mt-6 shrink-0">
                        <div className="flex items-center">
                            <div className="flex p-3 bg-emerald-50 text-emerald-600 rounded-xl mr-4 shrink-0">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-1">
                                    Laporan Keuangan{" "}
                                    {dayjs().format("MMMM YYYY")}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Unduh rekapitulasi pemasukan dan pengeluaran
                                    bulan ini.
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
                            <Link
                                to="/laporan"
                                className="inline-flex w-full sm:w-[140px] items-center justify-center px-6 py-2.5 bg-white border border-emerald-500 text-emerald-600 font-bold text-sm rounded-xl hover:bg-emerald-50 hover:border-emerald-600 hover:text-emerald-700 shadow-sm transition-all focus:ring-2 focus:ring-emerald-500/50 focus:outline-none cursor-pointer"
                            >
                                Lihat Disini
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}