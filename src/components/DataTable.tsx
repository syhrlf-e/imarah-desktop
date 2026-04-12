import React, { ReactNode, useState, useEffect } from "react";
 // import { router } from "@inertiajs/react";

export interface ColumnDef<T> {
    key: string;
    header: string;
    headerClassName?: string;
    cellClassName?: string | ((row: T) => string);
    render: (row: T) => ReactNode;
    width?: string; // for table-fixed, e.g. "w-[15%]"
}

interface DataTableProps<T> {
    columns: ColumnDef<T>[];
    data: T[];
    keyExtractor: (row: T) => string;
    emptyState?: ReactNode;
    tableFixed?: boolean;
    className?: string;
    isLoading?: boolean;
}

export default function DataTable<T>({
    columns,
    data,
    keyExtractor,
    emptyState,
    tableFixed = false,
    className = "",
    isLoading = false,
}: DataTableProps<T>) {
    const resolveClass = (
        cls: string | ((row: T) => string) | undefined,
        row: T,
    ): string => {
        if (!cls) return "";
        if (typeof cls === "function") return cls(row);
        return cls;
    };

    const [isFetchingLocal, setIsFetchingLocal] = useState(false);

    useEffect(() => {
        // Inertia routing events handled gracefully since we're SPA now
    }, []);

    const showLoading = isLoading || isFetchingLocal;

    return (
        <div
            className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${className}`}
        >
            <div className="overflow-auto flex-1">
                <table
                    className={`w-full text-sm text-left align-middle whitespace-nowrap ${tableFixed ? "table-fixed min-w-[800px]" : "min-w-[800px]"}`}
                >
                    <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-20">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className={`px-5 py-3 md:px-6 md:py-4 ${col.width ?? ""} ${col.headerClassName ?? ""}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                        {showLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr
                                    key={`skeleton-${i}`}
                                    className="animate-pulse"
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className="px-5 py-3 md:px-6 md:py-4"
                                        >
                                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length > 0 ? (
                            data.map((row) => (
                                <tr
                                    key={keyExtractor(row)}
                                    className="bg-white hover:bg-slate-50/80 transition-colors group"
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={`px-5 py-3 md:px-6 md:py-4 ${resolveClass(col.cellClassName, row)}`}
                                        >
                                            {col.render(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="py-12">
                                    {emptyState ?? (
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <p className="font-medium">
                                                Tidak ada data
                                            </p>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
