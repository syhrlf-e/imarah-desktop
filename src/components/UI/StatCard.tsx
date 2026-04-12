import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: {
        label: string;
        positive: boolean;
    };
    colorScheme?: "emerald" | "red" | "blue" | "slate";
    className?: string;
}

export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    colorScheme = "slate",
    className = "",
}: StatCardProps) {
    const colorClasses = {
        emerald:
            "bg-emerald-50 border-emerald-100 text-emerald-800 title-emerald-700 subtitle-emerald-600",
        red: "bg-red-50 border-red-100 text-red-800 title-red-700 subtitle-red-600",
        blue: "bg-blue-50 border-blue-100 text-blue-800 title-blue-700 subtitle-blue-600",
        slate: "bg-white border-slate-200 text-slate-800 title-slate-500 subtitle-slate-500",
    };

    const scheme = colorClasses[colorScheme] || colorClasses.slate;
    const [bg, border, text, titleText, subtitleText] = scheme.split(" ");

    return (
        <div className={`rounded-2xl p-5 border ${bg} ${border} ${className}`}>
            <div className="flex justify-between items-start mb-1">
                <p className={`text-sm ${titleText}`}>{title}</p>
                {Icon && <Icon className={`w-5 h-5 ${titleText} opacity-70`} />}
            </div>
            <p className={`text-2xl font-bold ${text} break-words`}>
                {value}
                {subtitle && (
                    <span
                        className={`text-sm font-normal ml-1 ${subtitleText}`}
                    >
                        {subtitle}
                    </span>
                )}
            </p>
            {trend && (
                <div className="mt-2 text-xs font-medium">
                    <span
                        className={
                            trend.positive ? "text-emerald-600" : "text-red-500"
                        }
                    >
                        {trend.positive ? "+" : "-"}
                        {trend.label}
                    </span>
                </div>
            )}
        </div>
    );
}
