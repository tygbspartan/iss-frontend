"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button, inputClass } from "./ui";

let nextKey = 0;
const newKey = () => `item-${nextKey++}`;

const ICON_BUTTON =
  "flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

// An editable list of short lines (e.g. what a service includes): one text box
// per item, with buttons to move an item up or down or remove it, and "Add
// item" at the bottom. Enter in an item adds a new one right after it.
// Blank items are dropped when the form is saved.
export function ListEditor({
  id,
  value,
  onChange,
  placeholder,
  invalid,
  describedBy,
}: {
  id: string;
  value: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  // Stable keys, so a box keeps its focus and cursor while items move around.
  const [keys, setKeys] = useState(() => value.map(newKey));
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const focusLater = (key: string) => requestAnimationFrame(() => inputs.current.get(key)?.focus());

  const update = (items: string[], itemKeys: string[]) => {
    setKeys(itemKeys);
    onChange(items);
  };
  const insert = (at: number) => {
    const key = newKey();
    update([...value.slice(0, at), "", ...value.slice(at)], [...keys.slice(0, at), key, ...keys.slice(at)]);
    focusLater(key);
  };
  const remove = (at: number) =>
    update(
      value.filter((_, i) => i !== at),
      keys.filter((_, i) => i !== at),
    );
  const move = (from: number, to: number) => {
    const items = [...value];
    const itemKeys = [...keys];
    [items[from], items[to]] = [items[to], items[from]];
    [itemKeys[from], itemKeys[to]] = [itemKeys[to], itemKeys[from]];
    update(items, itemKeys);
    focusLater(itemKeys[to]);
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ol className="space-y-2">
          {value.map((item, i) => (
            <li key={keys[i]} className="flex items-center gap-1.5">
              <span className="w-5 shrink-0 text-right text-xs tabular-nums text-zinc-400">{i + 1}.</span>
              <input
                ref={(el) => {
                  if (el) inputs.current.set(keys[i], el);
                  else inputs.current.delete(keys[i]);
                }}
                id={i === 0 ? id : undefined}
                type="text"
                value={item}
                maxLength={200}
                placeholder={placeholder}
                aria-label={`Item ${i + 1}`}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // don't submit the form
                    insert(i + 1);
                  }
                }}
                className={inputClass}
              />
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move item ${i + 1} up`} className={ICON_BUTTON}>
                <ArrowUp className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === value.length - 1}
                aria-label={`Move item ${i + 1} down`}
                className={ICON_BUTTON}
              >
                <ArrowDown className="size-4" aria-hidden />
              </button>
              <button type="button" onClick={() => remove(i)} aria-label={`Remove item ${i + 1}`} className={`${ICON_BUTTON} hover:text-red-600!`}>
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      )}
      <Button type="button" variant="secondary" onClick={() => insert(value.length)} id={value.length === 0 ? id : undefined}>
        <Plus className="size-4" aria-hidden /> Add item
      </Button>
    </div>
  );
}
