import React, { useState, useMemo } from 'react';

export interface ColumnDef<T> {
  key: string;
  title: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  totalItems?: number;
  currentPage?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  isLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (key: string, dir: 'asc' | 'desc') => void;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  totalItems,
  currentPage = 1,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  filters,
  actions,
  emptyMessage = 'Không có dữ liệu phù hợp',
  emptyIcon = '📭',
  sortKey: controlledSortKey,
  sortDirection: controlledSortDir,
  onSortChange,
  title,
  subtitle,
  className = '',
}: DataTableProps<T>) {
  // Local sorting if un-controlled
  const [internalSortKey, setInternalSortKey] = useState<string>('');
  const [internalSortDir, setInternalSortDir] = useState<'asc' | 'desc'>('asc');

  const currentSortKey = controlledSortKey !== undefined ? controlledSortKey : internalSortKey;
  const currentSortDir = controlledSortDir !== undefined ? controlledSortDir : internalSortDir;

  const handleSort = (key: string) => {
    let newDir: 'asc' | 'desc' = 'asc';
    if (currentSortKey === key) {
      newDir = currentSortDir === 'asc' ? 'desc' : 'asc';
    }

    if (onSortChange) {
      onSortChange(key, newDir);
    } else {
      setInternalSortKey(key);
      setInternalSortDir(newDir);
    }
  };

  // Client-side fallback sorting if no totalItems / server pagination is provided
  const sortedData = useMemo(() => {
    if (onSortChange || !currentSortKey) return data;
    return [...data].sort((a, b) => {
      // @ts-expect-error dynamic key access
      const valA = a[currentSortKey];
      // @ts-expect-error dynamic key access
      const valB = b[currentSortKey];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const compare = valA > valB ? 1 : -1;
      return currentSortDir === 'asc' ? compare : -compare;
    });
  }, [data, currentSortKey, currentSortDir, onSortChange]);

  const effectiveTotal = totalItems !== undefined ? totalItems : sortedData.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, effectiveTotal);

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
      {/* Table Header / Toolbar */}
      {(title || searchQuery !== undefined || filters || actions) && (
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col gap-3.5">
          {/* Title & Subtitle */}
          {(title || actions) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {title && (
                <div>
                  <h3 className="text-base font-bold text-slate-900">{title}</h3>
                  {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
                </div>
              )}
              {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
            </div>
          )}

          {/* Search & Filters */}
          {(searchQuery !== undefined || filters) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {searchQuery !== undefined && (
                <div className="relative max-w-sm w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => onSearchChange?.('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
            </div>
          )}
        </div>
      )}

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {columns.map((col) => {
                const isSorted = currentSortKey === col.key;
                const alignClass =
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                      ? 'text-right'
                      : 'text-left';

                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={`py-3.5 px-4 font-semibold select-none ${alignClass} ${
                      col.sortable ? 'cursor-pointer hover:bg-slate-100/70 hover:text-slate-800 transition-colors' : ''
                    } ${col.className || ''}`}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                      <span>{col.title}</span>
                      {col.sortable && (
                        <span className={`text-[10px] ${isSorted ? 'text-brand-600 font-bold' : 'text-slate-300'}`}>
                          {isSorted ? (currentSortDir === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: Math.min(5, pageSize) }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={`s-col-${col.key}`} className="py-4 px-4">
                      <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="text-3xl mb-2">{emptyIcon}</div>
                  <p className="text-sm font-semibold text-slate-700">{emptyMessage}</p>
                  <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </td>
              </tr>
            ) : (
              // Data Rows
              sortedData.map((item, rowIdx) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                          ? 'text-right'
                          : 'text-left';

                    return (
                      <td key={col.key} className={`py-3.5 px-4 text-slate-700 ${alignClass} ${col.className || ''}`}>
                        {col.render
                          ? col.render(item, rowIdx)
                          : // @ts-expect-error dynamic access
                            item[col.key] !== null && item[col.key] !== undefined
                            ? // @ts-expect-error dynamic access
                              String(item[col.key])
                            : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {onPageChange && (
        <div className="px-4 py-3 sm:px-5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Hiển thị <strong className="text-slate-800">{effectiveTotal > 0 ? startRecord : 0}</strong> -{' '}
              <strong className="text-slate-800">{endRecord}</strong> trên{' '}
              <strong className="text-slate-800">{effectiveTotal}</strong> mục
            </span>

            {onPageSizeChange && (
              <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-200">
                <span>Số dòng:</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-md px-1.5 py-0.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
            >
              ← Trước
            </button>

            <span className="px-2 py-1 font-semibold text-slate-800">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
            >
              Sau →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
