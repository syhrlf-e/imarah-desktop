import React from "react";
import { Wallet, Activity, ArrowUp, ArrowDown } from "lucide-react";

interface KasSummaryCardsProps {
    totalSaldo: number;
    pemasukanBulanIni: number;
    pengeluaranBulanIni: number;
    surplusDefisit?: number; // optional: jika diisi maka tampilkan card ke-4
    monthLabel?: string; // optional: label badge bulan (default: bulan ini)
    loading?: boolean; // optional: tampilkan skeleton state
    className?: string;
    formatter?: (value: number) => string;
}

function formatDefault(value: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div className={`bg-slate-100 rounded animate-pulse ${className}`} />
    );
}

export default function KasSummaryCards({
    totalSaldo,
    pemasukanBulanIni,
    pengeluaranBulanIni,
    surplusDefisit,
    monthLabel,
    loading = false,
    className = "",
    formatter = formatDefault,
}: KasSummaryCardsProps) {
    const hasSurplus = surplusDefisit !== undefined;
    const isPositive = (surplusDefisit ?? 0) >= 0;
    const gridCols = hasSurplus
        ? "grid-cols-2 md:grid-cols-2 lg:grid-cols-4"
        : "grid-cols-2 md:grid-cols-3";

    return (
        <>

            <div
                className={`hidden md:grid ${gridCols} gap-4 md:gap-6 ${className}`}
            >
                {/* Total Saldo Kas */}
                <div className="col-span-1 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div className="p-2 md:p-2.5 bg-emerald-50 rounded-xl">
                            <Wallet className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-slate-500 mb-1">
                        Total Saldo Kas
                    </p>
                    {loading ? (
                        <Skeleton className="h-8 w-32 mt-auto" />
                    ) : (
                        <h4 className="text-xl md:text-2xl font-bold text-slate-900 mt-auto">
                            {formatter(totalSaldo)}
                        </h4>
                    )}
                </div>

                {/* Pemasukan Bulan Ini */}
                <div className="col-span-1 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div className="p-2 md:p-2.5 bg-emerald-50 rounded-xl">
                            <ArrowUp className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                        </div>
                        {monthLabel && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] md:text-xs font-semibold bg-slate-100 text-slate-500">
                                {monthLabel}
                            </span>
                        )}
                    </div>
                    <p className="text-xs md:text-sm font-medium text-slate-500 mb-1">
                        Pemasukan Bln Ini
                    </p>
                    {loading ? (
                        <Skeleton className="h-6 w-24 mt-auto" />
                    ) : (
                        <h4 className="text-base md:text-2xl font-semibold md:font-bold text-emerald-600 mt-auto">
                            {formatter(pemasukanBulanIni)}
                        </h4>
                    )}
                </div>

                {/* Pengeluaran Bulan Ini */}
                <div className="col-span-1 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div className="p-2 md:p-2.5 bg-red-50 rounded-xl">
                            <ArrowDown className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                        </div>
                        {monthLabel && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] md:text-xs font-semibold bg-slate-100 text-slate-500">
                                {monthLabel}
                            </span>
                        )}
                    </div>
                    <p className="text-xs md:text-sm font-medium text-slate-500 mb-1">
                        Pengeluaran Bln Ini
                    </p>
                    {loading ? (
                        <Skeleton className="h-6 w-24 mt-auto" />
                    ) : (
                        <h4 className="text-base md:text-2xl font-semibold md:font-bold text-red-500 mt-auto">
                            {formatter(pengeluaranBulanIni)}
                        </h4>
                    )}
                </div>

                {/* Surplus / Defisit (optional card ke-4, desktop only) */}
                {hasSurplus && (
                    <div className="col-span-1 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-all duration-300">
                        <div className="flex justify-between items-start mb-3 md:mb-4">
                            <div
                                className={`p-2 md:p-2.5 rounded-xl ${isPositive ? "bg-blue-50" : "bg-orange-50"}`}
                            >
                                <Activity
                                    className={`w-4 h-4 md:w-5 md:h-5 ${isPositive ? "text-blue-600" : "text-orange-600"}`}
                                />
                            </div>
                            {monthLabel && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] md:text-xs font-semibold bg-slate-100 text-slate-500">
                                    {monthLabel}
                                </span>
                            )}
                        </div>
                        <p className="text-xs md:text-sm font-medium text-slate-500 mb-1">
                            {isPositive ? "Surplus" : "Defisit"} Bersih
                        </p>
                        {loading ? (
                            <Skeleton className="h-6 w-24 mt-auto" />
                        ) : (
                            <h4
                                className={`text-base md:text-2xl font-semibold md:font-bold mt-auto ${isPositive ? "text-blue-600" : "text-orange-600"}`}
                            >
                                {surplusDefisit! > 0 ? "+" : ""}
                                {formatter(surplusDefisit!)}
                            </h4>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
