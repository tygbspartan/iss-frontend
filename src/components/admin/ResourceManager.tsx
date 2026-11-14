"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { getErrorMessage } from "@/lib/redux/errors";
import type { ResourceConfig } from "@/lib/admin/resource";
import { ResourceForm } from "./ResourceForm";
import { Alert, Button, ConfirmDialog, inputClass, Spinner, Thumb } from "./ui";

const PAGE_SIZE = 20;

type Row = { id: string; image: string };

// Lists refresh themselves: every mutation invalidates its RTK Query tags,
// which refetches the affected lists (and related ones, e.g. project ↔ service).
export function ResourceManager<T extends Row>({
  config,
  children,
}: {
  config: ResourceConfig<T>;
  /** Optional extra content shown between the page title and the list. */
  children?: React.ReactNode;
}) {
  const { api } = config;
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isFetching } = api.useAdminList({ page, limit: PAGE_SIZE });
  const [update] = api.useUpdate();
  const [remove] = api.useDelete();

  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Deleting the last row of the last page leaves us past the end.
  if (data && page > data.totalPages) setPage(data.totalPages);

  const flash = (tone: "success" | "error", text: string) => {
    setNotice({ tone, text });
    if (tone === "success") setTimeout(() => setNotice((n) => (n?.text === text ? null : n)), 3000);
  };

  const toggle = async (item: T) => {
    const field = config.toggle.field;
    setTogglingId(item.id);
    try {
      await update({ id: item.id, body: { [field]: !(item as Record<string, unknown>)[field] } }).unwrap();
    } catch (e) {
      flash("error", getErrorMessage(e));
    } finally {
      setTogglingId(null);
    }
  };

  const statusBadge = (item: T) => {
    const on = Boolean((item as Record<string, unknown>)[config.toggle.field]);
    return (
      <button
        type="button"
        onClick={() => toggle(item)}
        disabled={togglingId === item.id}
        title="Click to toggle"
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition disabled:opacity-50 ${
          on
            ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-300"
            : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
        }`}
      >
        {on ? config.toggle.on : config.toggle.off}
      </button>
    );
  };

  const rowActions = (item: T) => (
    <div className="flex shrink-0 justify-end gap-1">
      <Button variant="ghost" className="px-2" onClick={() => setEditing({ id: item.id })} aria-label={`Edit ${config.primary(item)}`}>
        <Pencil className="size-4" />
      </Button>
      <Button variant="ghost" className="px-2 hover:text-red-600" onClick={() => setDeleting(item)} aria-label={`Delete ${config.primary(item)}`}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );

  const items = data?.items;
  const q = query.trim().toLowerCase();
  const visible = q && items ? items.filter((i) => config.primary(i).toLowerCase().includes(q)) : items;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{config.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{config.description}</p>
        </div>
        <Button onClick={() => setEditing({ id: null })}>
          <Plus className="size-4" aria-hidden />
          New {config.singular.toLowerCase()}
        </Button>
      </header>

      {children}

      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 p-3 dark:border-zinc-800">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={config.paginated ? "Filter this page…" : "Filter…"}
              aria-label={`Filter ${config.title.toLowerCase()}`}
              className={`${inputClass} pl-8`}
            />
          </div>
          <span className="flex shrink-0 items-center gap-2 text-sm text-zinc-500">
            {isFetching && !isLoading && <Loader2 className="size-3.5 animate-spin" aria-label="Refreshing" />}
            {data?.total ?? 0} total
          </span>
        </div>

        {error && !data ? (
          <div className="p-4">
            <Alert>{getErrorMessage(error)}</Alert>
          </div>
        ) : !visible ? (
          <Spinner />
        ) : visible.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-zinc-500">
            {q ? "No matches." : `No ${config.title.toLowerCase()} yet.`}
          </div>
        ) : (
          <>
          {/* Phones: stacked cards — a table can't fit 390px without sideways scrolling. */}
          <ul className="divide-y divide-zinc-200 sm:hidden dark:divide-zinc-800">
            {visible.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-3 py-3">
                <Thumb src={item.image} alt="" size="size-12" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{config.primary(item)}</div>
                  {config.secondary && (
                    <div className="truncate text-xs text-zinc-500">{config.secondary(item)}</div>
                  )}
                  <div className="mt-1.5">{statusBadge(item)}</div>
                </div>
                {rowActions(item)}
              </li>
            ))}
          </ul>

          {/* Tablet and up: the full table. */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{config.singular}</th>
                  {config.columns.map((c) => (
                    <th key={c.label} className={`px-4 py-2.5 font-medium ${c.className ?? ""}`}>
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {visible.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb src={item.image} alt="" />
                          <div className="min-w-0 max-w-[18rem]">
                            <div className="truncate font-medium">{config.primary(item)}</div>
                            {config.secondary && (
                              <div className="truncate text-xs text-zinc-500">{config.secondary(item)}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      {config.columns.map((c) => (
                        <td key={c.label} className={`px-4 py-3 text-zinc-600 dark:text-zinc-400 ${c.className ?? ""}`}>
                          {c.render(item)}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        {statusBadge(item)}
                      </td>
                      <td className="px-4 py-3">
                        {rowActions(item)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}

        {config.paginated && data && data.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800">
            <span className="text-zinc-500">
              Page {page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                <ChevronLeft className="size-4" aria-hidden /> Previous
              </Button>
              <Button variant="secondary" onClick={() => setPage(page + 1)} disabled={page >= data.totalPages}>
                Next <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <ResourceForm
          key={editing.id ?? "new"}
          config={config}
          itemId={editing.id}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            flash("success", message);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete ${config.singular.toLowerCase()}?`}
          message={
            <>
              <strong className="text-zinc-900 dark:text-zinc-100">{config.primary(deleting)}</strong> and its
              images will be permanently deleted. This can&apos;t be undone.
            </>
          }
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await remove(deleting.id).unwrap();
            setDeleting(null);
            flash("success", `${config.singular} deleted`);
          }}
        />
      )}
    </div>
  );
}
