import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ExternalLink,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { JobApplication, JobStatus } from "../services/api";
import { StatusBadge } from "./StatusBadge";

const columnHelper = createColumnHelper<JobApplication>();

interface JobTableProps {
  jobs: JobApplication[];
  onEdit: (job: JobApplication) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: JobStatus) => void;
}

export function JobTable({
  jobs,
  onEdit,
  onDelete,
  onStatusChange,
}: JobTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = [
    columnHelper.accessor("company", {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-teal-400 transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Company
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ArrowUpDown className="w-4 h-4 opacity-50" />
          )}
        </button>
      ),
      cell: (info) => (
        <span className="font-medium text-zinc-100">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("position", {
      header: "Position",
      cell: (info) => <span className="text-zinc-300">{info.getValue()}</span>,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const status = info.getValue();
        return (
          <select
            value={status}
            onChange={(e) =>
              onStatusChange(info.row.original.id, e.target.value as JobStatus)
            }
            className="bg-transparent border-none cursor-pointer focus:outline-none"
          >
            <option value="applied">Applied</option>
            <option value="screening">Screening</option>
            <option value="interviewing">Interviewing</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        );
      },
    }),
    columnHelper.accessor("source", {
      header: "Source",
      cell: (info) => (
        <span className="text-zinc-400">{info.getValue() || "—"}</span>
      ),
    }),
    columnHelper.accessor("applied_date", {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-teal-400 transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Applied
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ArrowUpDown className="w-4 h-4 opacity-50" />
          )}
        </button>
      ),
      cell: (info) => {
        const date = info.getValue();
        return (
          <span className="text-zinc-400">
            {date ? new Date(date).toLocaleDateString() : "—"}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <div className="flex items-center gap-2 justify-end">
          {info.row.original.job_url && (
            <a
              href={info.row.original.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-zinc-500 hover:text-teal-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => onEdit(info.row.original)}
            className="p-1.5 text-zinc-500 hover:text-blue-400 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(info.row.original.id)}
            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: jobs,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search companies or positions..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
      />

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-zinc-800 bg-zinc-800/30"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-zinc-400"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-zinc-500"
                >
                  No job applications yet. Sync from Gmail or add one manually!
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-zinc-500">
        Showing {table.getRowModel().rows.length} of {jobs.length} applications
      </div>
    </div>
  );
}


