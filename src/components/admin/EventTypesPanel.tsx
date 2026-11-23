"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  useCreateEventTypeMutation,
  useDeleteEventTypeMutation,
  useGetAdminEventTypesQuery,
  useUpdateEventTypeMutation,
} from "@/lib/redux/features/eventTypes/eventTypesApi";
import { getErrorMessage, getFieldErrors } from "@/lib/redux/errors";
import type { EventType } from "@/lib/admin/types";
import { Alert, Button, ConfirmDialog, inputClass, Modal, Spinner } from "./ui";

// Event types live on the Projects page rather than in their own section: they
// exist only to group projects, and the project form's dropdown reads from
// this list. The website's Projects page shows one filter per type that has
// visible projects.
export function EventTypesPanel() {
  const { data: types, error, isLoading } = useGetAdminEventTypesQuery();
  const [remove] = useDeleteEventTypeMutation();
  const [editing, setEditing] = useState<EventType | "new" | null>(null);
  const [deleting, setDeleting] = useState<EventType | null>(null);

  return (
    <section aria-labelledby="event-types-heading" className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="min-w-0">
          <h2 id="event-types-heading" className="text-base font-semibold">
            Event types
          </h2>
          <p className="text-sm text-zinc-500">
            The kinds of event projects are grouped by — the filters on the website&apos;s Projects page.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setEditing("new")}>
          <Plus className="size-4" aria-hidden />
          New event type
        </Button>
      </div>

      {error && !types ? (
        <div className="p-4">
          <Alert>{getErrorMessage(error)}</Alert>
        </div>
      ) : isLoading || !types ? (
        <Spinner />
      ) : types.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-zinc-500">No event types yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {types.map((type) => {
            const projects = type._count?.projects ?? 0;
            return (
              <li key={type.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-7 shrink-0 text-center text-xs tabular-nums text-zinc-400" title="Display order">
                  {type.sortOrder}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{type.name}</div>
                  <div className="text-xs text-zinc-500">
                    {projects} {projects === 1 ? "project" : "projects"}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" className="px-2" onClick={() => setEditing(type)} aria-label={`Edit ${type.name}`}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" className="px-2 hover:text-red-600" onClick={() => setDeleting(type)} aria-label={`Delete ${type.name}`}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <EventTypeForm
          key={editing === "new" ? "new" : editing.id}
          type={editing === "new" ? null : editing}
          nextOrder={types ? Math.max(-1, ...types.map((t) => t.sortOrder)) + 1 : 0}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete event type?"
          message={
            <>
              <strong className="text-zinc-900 dark:text-zinc-100">{deleting.name}</strong> will be deleted. Its projects
              stay, just without an event type until you pick another one.
            </>
          }
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await remove(deleting.id).unwrap();
            setDeleting(null);
          }}
        />
      )}
    </section>
  );
}

function EventTypeForm({
  type,
  nextOrder,
  onClose,
}: {
  type: EventType | null; // null → create
  nextOrder: number; // suggested display order for a new type (after the last one)
  onClose: () => void;
}) {
  const [create] = useCreateEventTypeMutation();
  const [update] = useUpdateEventTypeMutation();
  const [name, setName] = useState(type?.name ?? "");
  const [sortOrder, setSortOrder] = useState(String(type?.sortOrder ?? nextOrder));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setFieldErrors({ name: ["Event type name is required"] });
      return;
    }
    setFieldErrors({});
    setSaving(true);
    const body = { name: name.trim(), sortOrder: sortOrder === "" ? 0 : Number(sortOrder) };
    try {
      await (type ? update({ id: type.id, body }) : create(body)).unwrap();
      onClose();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal title={type ? "Edit event type" : "New event type"} onClose={onClose} size="max-w-md">
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <div className="space-y-1.5">
          <label htmlFor="event-type-name" className="block text-sm font-medium">
            Event type name<span className="text-red-600"> *</span>
          </label>
          <input
            id="event-type-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={fieldErrors.name?.length ? true : undefined}
            placeholder="e.g. Weddings"
            className={inputClass}
          />
          {fieldErrors.name?.length ? <p className="text-xs text-red-600">{fieldErrors.name.join(", ")}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="event-type-order" className="block text-sm font-medium">
            Display order
          </label>
          <input
            id="event-type-order"
            type="number"
            min={0}
            step={1}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            aria-invalid={fieldErrors.sortOrder?.length ? true : undefined}
            className={inputClass}
          />
          {fieldErrors.sortOrder?.length ? (
            <p className="text-xs text-red-600">{fieldErrors.sortOrder.join(", ")}</p>
          ) : (
            <p className="text-xs text-zinc-500">Lower numbers show first in the Projects page filters.</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {type ? "Save changes" : "Create event type"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
