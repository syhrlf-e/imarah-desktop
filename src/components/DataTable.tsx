import React, { ReactNode } from "react";

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
}

export default function DataTable<T>({
  columns,
  data = [],
  keyExtractor,
  emptyState,
  tableFixed = false,
  className = "",
  loading = false,
}: DataTableProps<T>) {
  const resolveClass = (cls: any, row: T): string => {
    if (!cls) return "";
    return typeof cls === "function" ? cls(row) : cls;
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${className}`}
    >
      <div className="overflow-auto flex-1">
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
            {loading ? (
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
                <td colSpan={columns.length} className="py-20 text-center">
                  {emptyState ?? (
                    <p className="text-slate-400 font-medium">
                      Tidak ada data ditemukan
                    </p>
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
