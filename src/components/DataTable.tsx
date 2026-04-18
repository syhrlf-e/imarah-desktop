import React, { ReactNode } from "react";
import { motion } from "framer-motion";

export interface ColumnDef<T> {
  key: string;
  header: string;
  headerClassName?: string;
  cellClassName?: string | ((row: T) => string);
  render: (row: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyState?: ReactNode;
  tableFixed?: boolean;
  className?: string;
  loading?: boolean;
  isFetching?: boolean;
}

export default function DataTable<T>({
  columns,
  data = [],
  keyExtractor,
  emptyState,
  tableFixed = false,
  className = "",
  loading = false,
  isFetching = false,
}: DataTableProps<T>) {
  const resolveClass = (cls: any, row: T): string => {
    if (!cls) return "";
    return typeof cls === "function" ? cls(row) : cls;
  };

  const showSkeleton = loading || (isFetching && data.length === 0);

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative ${className}`}
    >
      {/* Background Refetch Indicator */}
      {isFetching && data.length > 0 && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500/20 z-30 overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="h-full w-1/3 bg-green-600"
          />
        </div>
      )}

      <div className={`overflow-auto flex-1 transition-opacity duration-200 ${isFetching && data.length > 0 ? "opacity-60" : "opacity-100"}`}>
        <table
          className={`w-full text-sm text-left align-middle whitespace-nowrap ${tableFixed ? "table-fixed" : ""}`}
        >
          <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-20">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 ${col.width ?? ""} ${col.headerClassName ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {showSkeleton ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 ${resolveClass(col.cellClassName, row)}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <div className="w-full min-h-[320px] flex flex-col items-center justify-center">
                    {emptyState ?? (
                      <p className="text-slate-400 font-medium">
                        Tidak ada data ditemukan
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
