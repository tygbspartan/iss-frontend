"use client";

import { useEffect, useMemo, useRef } from "react";
import { ImagePlus } from "lucide-react";
import { Button, Thumb } from "./ui";

export const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp,image/gif";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // matches the backend limit

// Client-side pre-check so obvious mistakes fail fast; the backend still
// verifies the real file bytes.
export const checkImageFile = (file: File): string | null => {
  if (!ACCEPTED_IMAGES.split(",").includes(file.type)) {
    return `${file.name}: only JPEG, PNG, WebP and GIF images are allowed`;
  }
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: images must be 5 MB or smaller`;
  return null;
};

export function useObjectUrl(file: File | null): string | null {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

// Images are mandatory on every resource, so this only chooses or replaces —
// there is no "remove".
export function ImagePicker({
  label,
  current,
  file,
  onChange,
  onError,
  error,
}: {
  label: string;
  current: string | null; // image already saved on the record
  file: File | null; // newly chosen file, saved with the form
  onChange: (file: File) => void;
  onError: (message: string) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useObjectUrl(file);
  const shown = preview ?? current;

  return (
    <div className="flex items-center gap-4">
      <div className={`rounded-md ${error ? "ring-2 ring-red-500" : ""}`}>
        <Thumb src={shown} alt={`${label} preview`} size="size-24" />
      </div>
      <div className="min-w-0 space-y-2">
        <Button variant="secondary" onClick={() => inputRef.current?.click()}>
          <ImagePlus className="size-4" aria-hidden />
          {shown ? `Replace ${label.toLowerCase()}` : `Choose ${label.toLowerCase()}`}
        </Button>
        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : (
          <p className="text-xs text-zinc-500">JPEG, PNG, WebP or GIF · max 5 MB</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGES}
        className="hidden"
        onChange={(e) => {
          const chosen = e.target.files?.[0];
          e.target.value = ""; // allow re-choosing the same file
          if (!chosen) return;
          const problem = checkImageFile(chosen);
          if (problem) return onError(problem);
          onChange(chosen);
        }}
      />
    </div>
  );
}
