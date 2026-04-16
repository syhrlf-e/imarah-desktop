import { ReactNode } from "react";

interface WidgetContainerProps {
    children: ReactNode;
    className?: string;
}

export default function WidgetContainer({
    children,
    className = "",
}: WidgetContainerProps) {
    return (
        <div
            className={`min-w-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${className}`}
        >
            {children}
        </div>
    );
}
