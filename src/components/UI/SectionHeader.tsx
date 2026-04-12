import { Link } from "react-router-dom";
import { ArrowRight, LucideIcon } from "lucide-react";

interface SectionHeaderProps {
    title: string;
    icon?: LucideIcon;
    subtitle?: string;
    actionLabel?: string;
    actionHref?: string;
    className?: string;
}

export default function SectionHeader({
    title,
    icon: Icon,
    subtitle,
    actionLabel,
    actionHref,
    className = "",
}: SectionHeaderProps) {
    return (
        <div
            className={`flex justify-between items-center bg-slate-50/50 p-5 border-b border-slate-100 shrink-0 ${className}`}
        >
            <div>
                <h3 className="font-semibold text-slate-800 text-base flex items-center">
                    {Icon && <Icon className="w-5 h-5 mr-2 text-emerald-500" />}
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                )}
            </div>
            {actionHref && actionLabel && (
                <Link
                    to={actionHref}
                    className="text-xs text-emerald-600 font-medium hover:text-emerald-700 flex items-center"
                >
                    {actionLabel} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
            )}
        </div>
    );
}
