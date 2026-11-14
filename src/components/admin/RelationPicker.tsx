"use client";

import { useState } from "react";
import type { RelationOption } from "@/lib/redux/api";
import type { QueryState } from "@/lib/admin/resource";
import { getErrorMessage } from "@/lib/redux/errors";
import { inputClass } from "./ui";

// Checkbox list for many-to-many links (project ↔ service).
export function RelationPicker({
  id,
  useOptions,
  value,
  onChange,
  invalid,
}: {
  id: string;
  useOptions: () => QueryState<RelationOption[]>; // RTK Query hook
  value: string[];
  onChange: (ids: string[]) => void;
  invalid?: boolean;
}) {
  const { data: options, error, isLoading } = useOptions();
  const [query, setQuery] = useState("");

  if (error) return <p className="text-sm text-red-600">{getErrorMessage(error)}</p>;
  if (isLoading || !options) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (options.length === 0) return <p className="text-sm text-zinc-500">Nothing to link yet.</p>;

  const selected = new Set(value);
  const q = query.trim().toLowerCase();
  const visible = q ? options.filter((o) => o.title.toLowerCase().includes(q)) : options;

  return (
    <div className={`rounded-md border ${invalid ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"}`}>
      {options.length > 6 && (
        <div className="border-b border-zinc-200 p-2 dark:border-zinc-800">
          <input
            id={id}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className={inputClass}
          />
        </div>
      )}
      <ul className="max-h-48 space-y-0.5 overflow-y-auto p-2">
        {visible.map((option) => (
          <li key={option.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <input
                type="checkbox"
                className="size-4 accent-zinc-900 dark:accent-zinc-100"
                checked={selected.has(option.id)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...value, option.id] : value.filter((v) => v !== option.id))
                }
              />
              <span className="min-w-0 flex-1 break-words">{option.title}</span>
              {option.isActive === false && <span className="text-xs text-zinc-500">hidden</span>}
            </label>
          </li>
        ))}
        {visible.length === 0 && <li className="px-2 py-1.5 text-sm text-zinc-500">No matches</li>}
      </ul>
      <p className="border-t border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 dark:border-zinc-800">
        {value.length} selected
      </p>
    </div>
  );
}
