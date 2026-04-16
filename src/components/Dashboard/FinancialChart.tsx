import { Activity } from "lucide-react";
import { formatRupiah } from "@/utils/formatter";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import WidgetContainer from "@/components/UI/WidgetContainer";

interface ChartData {
    name: string;
    pemasukan: number;
    pengeluaran: number;
}

interface FinancialChartProps {
    data: ChartData[];
    loading?: boolean;
}

const formatCompactNumber = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(number);
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 text-sm z-50">
                <p className="font-bold text-slate-800 mb-2">{label}</p>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-600">Pemasukan:</span>
                        <span className="font-semibold text-slate-800">
                            {formatRupiah(payload[0].value)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <span className="text-slate-600">Pengeluaran:</span>
                        <span className="font-semibold text-slate-800">
                            {formatRupiah(payload[1].value)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function FinancialChart({ data, loading }: FinancialChartProps) {
    return (
        <WidgetContainer className="flex min-h-0 min-w-0 flex-1 flex-col p-6">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-emerald-500" />
                        Grafik Arus Kas
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Sirkulasi dana 6 bulan terakhir
                    </p>
                </div>
            </div>

            <div className="h-[320px] w-full min-w-0 md:h-[360px]">
                {loading ? (
                    <div className="w-full h-full bg-slate-100/50 animate-pulse rounded-xl"></div>
                ) : (
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <AreaChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient
                                    id="colorIdPemasukan"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#10b981"
                                        stopOpacity={0.2}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#10b981"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                                <linearGradient
                                    id="colorIdPengeluaran"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#ef4444"
                                        stopOpacity={0.2}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#ef4444"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e2e8f0"
                            />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748b", fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748b", fontSize: 12 }}
                                tickFormatter={formatCompactNumber}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="pemasukan"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorIdPemasukan)"
                            />
                            <Area
                                type="monotone"
                                dataKey="pengeluaran"
                                stroke="#ef4444"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorIdPengeluaran)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </WidgetContainer>
    );
}
