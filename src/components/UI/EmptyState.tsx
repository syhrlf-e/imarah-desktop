import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    className?: string;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    className = "",
}: EmptyStateProps) {
    return (
        <div
            className={`h-full flex flex-col items-center justify-center p-8 text-center min-h-[150px] ${className}`}
        >
            <Icon className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium text-sm">{title}</p>
            {description && (
                <p className="text-slate-400 text-xs mt-1">{description}</p>
            )}
        </div>
    );
}
