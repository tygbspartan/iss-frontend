"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, X } from "lucide-react";
import { ACCEPTED_IMAGES, checkImageFile, useObjectUrl } from "./ImagePicker";
import { Button, Thumb } from "./ui";

export const MAX_THUMBNAILS = 30; // matches the backend limit

// Project gallery. Existing images can be reordered/removed (saved via PATCH
// `thumbnails`); new files are queued and uploaded after the project saves.
export function ThumbnailsEditor({
  existing,
  pending,
  onExistingChange,
  onPendingChange,
  onError,
}: {
  existing: string[];
  pending: File[];
  onExistingChange: (urls: string[]) => void;
  onPendingChange: (files: File[]) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const total = existing.length + pending.length;

  const move = (index: number, delta: number) => {
    const next = [...existing];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onExistingChange(next);
  };

  return (
    <div className="space-y-3">
      {total > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {existing.map((url, i) => (
            <li key={url} className="group relative">
              <Thumb src={url} alt={`Gallery image ${i + 1}`} size="aspect-square w-full" />
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                <IconButton label="Move left" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ChevronLeft className="size-4" />
                </IconButton>
                <IconButton label="Move right" disabled={i === existing.length - 1} onClick={() => move(i, 1)}>
                  <ChevronRight className="size-4" />
                </IconButton>
              </div>
              <RemoveButton onClick={() => onExistingChange(existing.filter((u) => u !== url))} />
            </li>
          ))}
          {pending.map((file, i) => (
            <PendingThumb
              key={`${file.name}-${file.lastModified}-${i}`}
              file={file}
              onRemove={() => onPendingChange(pending.filter((_, j) => j !== i))}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">No gallery images yet.</p>
      )}

      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={total >= MAX_THUMBNAILS}>
          <ImagePlus className="size-4" aria-hidden />
          Add images
        </Button>
        <span className="text-xs text-zinc-500">
          {total}/{MAX_THUMBNAILS} · new images upload when you save
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGES}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          const problems = files.map(checkImageFile).filter((p): p is string => !!p);
          if (problems.length) return onError(problems.join(". "));
          if (total + files.length > MAX_THUMBNAILS) {
            return onError(`A project can have at most ${MAX_THUMBNAILS} gallery images`);
          }
          onPendingChange([...pending, ...files]);
        }}
      />
    </div>
  );
}

function PendingThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useObjectUrl(file);
  return (
    <li className="relative">
      <Thumb src={url} alt={file.name} size="aspect-square w-full" />
      <span className="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
        New
      </span>
      <RemoveButton onClick={onRemove} />
    </li>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove image"
      className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-red-600"
    >
      <X className="size-3.5" />
    </button>
  );
}

function IconButton({
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="rounded-full bg-black/70 p-0.5 text-white hover:bg-black disabled:invisible"
      {...props}
    >
      {children}
    </button>
  );
}
