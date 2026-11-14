"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetAdminDepartmentsQuery,
  useUpdateDepartmentMutation,
} from "@/lib/redux/features/departments/departmentsApi";
import { getErrorMessage, getFieldErrors } from "@/lib/redux/errors";
import type { Department } from "@/lib/admin/types";
import { Alert, Button, ConfirmDialog, inputClass, Modal, Spinner } from "./ui";

// Departments live on the Team page rather than in their own section: they
// exist only to group team members, and the member form's dropdown reads from
// this list.
export function DepartmentsPanel() {
  const { data: departments, error, isLoading } = useGetAdminDepartmentsQuery();
  const [update] = useUpdateDepartmentMutation();
  const [remove] = useDeleteDepartmentMutation();
  const [editing, setEditing] = useState<Department | "new" | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const toggleCore = async (department: Department) => {
    setTogglingId(department.id);
    setNotice(null);
    try {
      await update({ id: department.id, body: { isCore: !department.isCore } }).unwrap();
    } catch (e) {
      setNotice(getErrorMessage(e));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <section aria-labelledby="departments-heading" className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="min-w-0">
          <h2 id="departments-heading" className="text-base font-semibold">
            Departments
          </h2>
          <p className="text-sm text-zinc-500">
            Group the team on the Teams page. Departments marked “About page” are the core people shown there.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setEditing("new")}>
          <Plus className="size-4" aria-hidden />
          New department
        </Button>
      </div>

      {notice && (
        <div className="px-4 pt-3">
          <Alert>{notice}</Alert>
        </div>
      )}

      {error && !departments ? (
        <div className="p-4">
          <Alert>{getErrorMessage(error)}</Alert>
        </div>
      ) : isLoading || !departments ? (
        <Spinner />
      ) : departments.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-zinc-500">
          No departments yet. Add one before adding team members.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {departments.map((department) => {
            const members = department._count?.members ?? 0;
            return (
              <li key={department.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-7 shrink-0 text-center text-xs tabular-nums text-zinc-400" title="Display order">
                  {department.sortOrder}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{department.name}</div>
                  <div className="text-xs text-zinc-500">
                    {members} {members === 1 ? "member" : "members"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleCore(department)}
                  disabled={togglingId === department.id}
                  aria-pressed={department.isCore}
                  title="Click to toggle"
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition disabled:opacity-50 ${
                    department.isCore
                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {department.isCore ? "About page" : "Teams page only"}
                </button>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" className="px-2" onClick={() => setEditing(department)} aria-label={`Edit ${department.name}`}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" className="px-2 hover:text-red-600" onClick={() => setDeleting(department)} aria-label={`Delete ${department.name}`}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <DepartmentForm
          key={editing === "new" ? "new" : editing.id}
          department={editing === "new" ? null : editing}
          nextOrder={departments ? Math.max(-1, ...departments.map((d) => d.sortOrder)) + 1 : 0}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete department?"
          message={
            <>
              <strong className="text-zinc-900 dark:text-zinc-100">{deleting.name}</strong> will be deleted. A
              department that still has team members can&apos;t be deleted — move them to another one first.
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

function DepartmentForm({
  department,
  nextOrder,
  onClose,
}: {
  department: Department | null; // null → create
  nextOrder: number; // suggested display order for a new department (after the last one)
  onClose: () => void;
}) {
  const [create] = useCreateDepartmentMutation();
  const [update] = useUpdateDepartmentMutation();
  const [name, setName] = useState(department?.name ?? "");
  const [sortOrder, setSortOrder] = useState(String(department?.sortOrder ?? nextOrder));
  const [isCore, setIsCore] = useState(department?.isCore ?? false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setFieldErrors({ name: ["Department name is required"] });
      return;
    }
    setFieldErrors({});
    setSaving(true);
    const body = { name: name.trim(), sortOrder: sortOrder === "" ? 0 : Number(sortOrder), isCore };
    try {
      await (department ? update({ id: department.id, body }) : create(body)).unwrap();
      onClose();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal title={department ? "Edit department" : "New department"} onClose={onClose} size="max-w-md">
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <div className="space-y-1.5">
          <label htmlFor="department-name" className="block text-sm font-medium">
            Department name<span className="text-red-600"> *</span>
          </label>
          <input
            id="department-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={fieldErrors.name?.length ? true : undefined}
            placeholder="e.g. Sound Engineers"
            className={inputClass}
          />
          {fieldErrors.name?.length ? <p className="text-xs text-red-600">{fieldErrors.name.join(", ")}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="department-order" className="block text-sm font-medium">
            Display order
          </label>
          <input
            id="department-order"
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
            <p className="text-xs text-zinc-500">Lower numbers show first on the Teams page.</p>
          )}
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={isCore}
            onChange={(e) => setIsCore(e.target.checked)}
            className="mt-0.5 size-4 accent-zinc-900 dark:accent-zinc-100"
          />
          <span>
            <span className="font-medium">Show on the About page</span>
            <span className="block text-xs text-zinc-500">
              Everyone in this department counts as a core person. They still appear on the Teams page too.
            </span>
          </span>
        </label>

        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {department ? "Save changes" : "Create department"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
