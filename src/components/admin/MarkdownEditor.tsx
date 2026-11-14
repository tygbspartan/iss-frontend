"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  SquareCode,
  Strikethrough,
} from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { inputClass } from "./ui";

// A plain textarea with a Markdown toolbar and a live preview. Toolbar actions
// go through `insertText` so the browser's own undo (Ctrl+Z) keeps working.

interface Edit {
  from: number; // range in the current text to replace
  to: number;
  insert: string;
  selectFrom: number; // selection afterwards, in the new text
  selectTo: number;
}

type Action = (text: string, start: number, end: number) => Edit;

// **bold**, _italic_ … — toggles off if the selection is already wrapped.
const wrap =
  (before: string, after: string, placeholder: string): Action =>
  (text, start, end) => {
    if (text.slice(start - before.length, start) === before && text.slice(end, end + after.length) === after) {
      const inner = text.slice(start, end);
      return { from: start - before.length, to: end + after.length, insert: inner, selectFrom: start - before.length, selectTo: start - before.length + inner.length };
    }
    const inner = text.slice(start, end) || placeholder;
    return { from: start, to: end, insert: before + inner + after, selectFrom: start + before.length, selectTo: start + before.length + inner.length };
  };

// "## ", "> ", "- ", "1. " at the start of each selected line — toggles off
// if every line already has it.
const prefixLines =
  (prefix: (index: number) => string, pattern: RegExp): Action =>
  (text, start, end) => {
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const nextBreak = text.indexOf("\n", end);
    const lineEnd = nextBreak === -1 ? text.length : nextBreak;
    const lines = text.slice(lineStart, lineEnd).split("\n");
    const allPrefixed = lines.every((l) => pattern.test(l));
    const insert = lines
      .map((l, i) => (allPrefixed ? l.replace(pattern, "") : prefix(i) + l.replace(/^(#{1,6} |> |- |\d+\. )/, "")))
      .join("\n");
    return { from: lineStart, to: lineEnd, insert, selectFrom: lineStart, selectTo: lineStart + insert.length };
  };

const link: Action = (text, start, end) => {
  const label = text.slice(start, end) || "link text";
  const insert = `[${label}](https://)`;
  const urlStart = start + label.length + 3;
  return { from: start, to: end, insert, selectFrom: urlStart, selectTo: urlStart + "https://".length };
};

const codeBlock: Action = (text, start, end) => {
  const inner = text.slice(start, end) || "code";
  const lead = start > 0 && text[start - 1] !== "\n" ? "\n" : "";
  const insert = `${lead}\`\`\`\n${inner}\n\`\`\`\n`;
  const innerStart = start + lead.length + 4;
  return { from: start, to: end, insert, selectFrom: innerStart, selectTo: innerStart + inner.length };
};

const divider: Action = (text, start, end) => {
  const lead = start > 0 && text[start - 1] !== "\n" ? "\n\n" : start > 0 ? "\n" : "";
  const insert = `${lead}---\n\n`;
  return { from: start, to: end, insert, selectFrom: start + insert.length, selectTo: start + insert.length };
};

const TOOLS: { label: string; icon: typeof Bold; action: Action; shortcut?: string }[] = [
  { label: "Heading", icon: Heading2, action: prefixLines(() => "## ", /^## /) },
  { label: "Subheading", icon: Heading3, action: prefixLines(() => "### ", /^### /) },
  { label: "Bold", icon: Bold, action: wrap("**", "**", "bold text"), shortcut: "b" },
  { label: "Italic", icon: Italic, action: wrap("_", "_", "italic text"), shortcut: "i" },
  { label: "Strikethrough", icon: Strikethrough, action: wrap("~~", "~~", "text") },
  { label: "Link", icon: Link2, action: link, shortcut: "k" },
  { label: "Quote", icon: Quote, action: prefixLines(() => "> ", /^> /) },
  { label: "Bulleted list", icon: List, action: prefixLines(() => "- ", /^- /) },
  { label: "Numbered list", icon: ListOrdered, action: prefixLines((i) => `${i + 1}. `, /^\d+\. /) },
  { label: "Inline code", icon: Code, action: wrap("`", "`", "code") },
  { label: "Code block", icon: SquareCode, action: codeBlock },
  { label: "Divider", icon: Minus, action: divider },
];

export function MarkdownEditor({
  id,
  value,
  onChange,
  rows = 16,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  invalid?: boolean;
  describedBy?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");

  const run = (action: Action) => {
    const ta = ref.current;
    if (!ta) return;
    const edit = action(ta.value, ta.selectionStart, ta.selectionEnd);
    ta.focus();
    ta.setSelectionRange(edit.from, edit.to);
    // insertText keeps the native undo stack and fires an input event (→ onChange).
    // execCommand is deprecated but remains the only way to do that; fall back
    // to a plain value update if a browser ever drops it.
    const inserted = document.execCommand?.("insertText", false, edit.insert);
    if (!inserted) onChange(ta.value.slice(0, edit.from) + edit.insert + ta.value.slice(edit.to));
    requestAnimationFrame(() => ta.setSelectionRange(edit.selectFrom, edit.selectTo));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    const tool = TOOLS.find((t) => t.shortcut === e.key.toLowerCase());
    if (tool) {
      e.preventDefault();
      run(tool.action);
    }
  };

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1 text-sm font-medium transition ${
      active
        ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100"
        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
    }`;

  return (
    <div
      className={`overflow-hidden rounded-md border ${
        invalid ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex gap-1 rounded-lg bg-zinc-200/60 p-0.5 dark:bg-zinc-950" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "write"} className={tabClass(tab === "write")} onClick={() => setTab("write")}>
            Write
          </button>
          <button type="button" role="tab" aria-selected={tab === "preview"} className={tabClass(tab === "preview")} onClick={() => setTab("preview")}>
            Preview
          </button>
        </div>
        {tab === "write" && (
          <div className="flex flex-wrap gap-0.5" role="toolbar" aria-label="Formatting">
            {TOOLS.map(({ label, icon: Icon, action, shortcut }) => (
              <button
                key={label}
                type="button"
                onClick={() => run(action)}
                title={shortcut ? `${label} (Ctrl+${shortcut.toUpperCase()})` : label}
                aria-label={label}
                className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === "write" ? (
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          placeholder="Write your post… Markdown is supported."
          // Mono text is denser, so 13px from sm up — but still 16px on phones (iOS zoom).
          className={`${inputClass.replace("sm:text-sm", "sm:text-[13px]")} block resize-y rounded-none border-0 font-mono leading-6 shadow-none focus:ring-0`}
        />
      ) : (
        <div className="min-h-64 bg-white px-4 py-3 dark:bg-zinc-900" style={{ minHeight: `${rows * 1.5}rem` }}>
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-sm text-zinc-500">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
