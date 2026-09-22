import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  pageSize?: number;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  searchPlaceholder = "Search records...",
  searchKey,
  pageSize = 10,
  emptyMessage = "No records found matching criteria.",
  loading = false,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filteredData = React.useMemo(() => {
    if (!searchTerm || !searchKey) return data;
    return data.filter((item) => {
      const val = item[searchKey];
      return val ? String(val).toLowerCase().includes(searchTerm.toLowerCase()) : false;
    });
  }, [data, searchTerm, searchKey]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-[#0B0F17] border border-slate-800 rounded-lg overflow-hidden shadow-sm">
      {searchKey && (
        <div className="p-3 border-b border-slate-800/80 bg-[#0F1522] flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-[#080C13] border border-slate-700/80 rounded text-xs text-slate-200 focus:outline-none focus:border-amber-500/80 transition-colors"
            />
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total: {filteredData.length} entries
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="enterprise-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={col.className || ""}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {columns.map((_, cIdx) => (
                    <td key={cIdx}>
                      <div className="h-4 bg-slate-800/60 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-slate-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr key={row.id || rIdx}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={col.className || ""}>
                      {col.render
                        ? col.render(row)
                        : typeof col.accessor === "function"
                        ? col.accessor(row)
                        : col.accessor
                        ? String((row as any)[col.accessor] ?? "")
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-2.5 border-t border-slate-800 bg-[#0F1522] flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {(page - 1) * pageSize + 1} -{" "}
            {Math.min(page * pageSize, filteredData.length)} of {filteredData.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded bg-[#182030] hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded bg-[#182030] hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
