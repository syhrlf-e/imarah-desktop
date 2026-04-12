import { Search } from "lucide-react";
import { ReactNode } from "react";

interface FilterBarProps {
    searchPlaceholder?: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    /** Elemen yang duduk berdampingan dengan search (misal: dropdown kategori, tab filter) */
    addon?: ReactNode;
    /** Tombol filter/sorting di sebelah kanan (misal: A-Z, Terbaru) */
    children?: ReactNode;
}

export default function FilterBar({
    searchPlaceholder = "Cari...",
    searchValue,
    onSearchChange,
    addon,
    children,
}: FilterBarProps) {
    return (
        <div className="mb-2 relative z-30 bg-white rounded-2xl shadow-sm border border-slate-200 p-3 md:p-4">
            <div className="grid grid-cols-[1fr_auto] md:flex md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                {/* Search Bar */}
                <div className="relative order-1 md:flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 md:py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-sm transition-colors shadow-sm"
                        placeholder={searchPlaceholder}
                    />
                </div>

                {/* Filter / Sort Buttons */}
                {children && (
                    <div className="flex items-center gap-2 order-2 md:order-3 shrink-0 justify-end">
                        {children}
                    </div>
                )}

                {/* Addon */}
                {addon && (
                    <div className="order-3 md:order-2 col-span-2 w-full md:w-auto shrink-0">
                        {addon}
                    </div>
                )}
            </div>
        </div>
    );
}
