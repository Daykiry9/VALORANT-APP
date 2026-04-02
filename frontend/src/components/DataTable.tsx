import React, { useState } from 'react';
import { cn } from '../lib/utils';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState
} from '@tanstack/react-table';

interface DataTableProps<TData, TValue> {
  columns: any[];
  data: TData[];
  className?: string;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  onRowClick
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className={cn("w-full relative border border-border-default overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-bg-base border-b-2 border-accent sticky top-0 font-display">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    className="px-4 py-3 cursor-pointer hover:bg-bg-elevated transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    <span className="ml-2 font-mono text-[10px] text-accent">
                      {{
                        asc: '▲',
                        desc: '▼',
                      }[header.column.getIsSorted() as string] ?? null}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="font-mono text-[13px]">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    "border-b border-border-default hover:bg-bg-elevated transition-colors group relative cursor-pointer",
                    i % 2 === 0 ? "bg-bg-surface" : "bg-bg-base"
                  )}
                >
                  {row.getVisibleCells().map((cell, cellIdx) => (
                    <td key={cell.id} className={cn("px-4 py-3 relative", cellIdx === 0 && "pl-5")}>
                      {cellIdx === 0 && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-text-secondary font-body">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4 px-4 bg-bg-base border-t border-border-default">
        <button
          className="px-2 py-1 border border-border-default font-mono text-xs hover:border-accent disabled:opacity-50"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          &lt; prev
        </button>
        <span className="text-xs font-mono">
          {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
        </span>
        <button
          className="px-2 py-1 border border-border-default font-mono text-xs hover:border-accent disabled:opacity-50"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          next &gt;
        </button>
      </div>
    </div>
  );
}
