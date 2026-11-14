"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, Loader2, X } from "lucide-react";
import { getErrorMessage } from "@/lib/redux/errors";

// Small shared building blocks for the admin panel.

// text-base (16px) below sm: iOS Safari zooms the page into any input with a
// smaller font on focus, which then lets the page pan sideways.
export const inputClass =
  "w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base sm:text-sm text-zinc-900 shadow-xs outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-60 aria-invalid:border-red-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300 dark:focus:ring-white/10";

const buttonVariants = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300",
  secondary:
    "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
  danger: "bg-red-600 text-white hover:bg-red-500",
  ghost:
    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
};

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function Alert({ children, tone = "error" }: { children: React.ReactNode; tone?: "error" | "success" }) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
      : "border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-sm wrap-anywhere ${styles}`}>
      {children}
    </div>
  );
}

export function Thumb({ src, alt, size = "size-10" }: { src: string | null; alt: string; size?: string }) {
  if (!src) {
    return (
      <div className={`${size} flex shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-400 dark:bg-zinc-800`}>
        <ImageOff className="size-4" aria-hidden />
      </div>
    );
  }
  return (
    // Plain <img>: admin previews come from Supabase or the API's /uploads,
    // which next/image would need configured as remote hosts.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`${size} shrink-0 rounded-md object-cover`} />
  );
}

// Native <dialog>: gives us focus trapping, Esc-to-close and a backdrop for free.
export function Modal({
  title,
  onClose,
  children,
  size = "max-w-2xl",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault(); // let the parent unmount us instead
        onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${size} rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-4 sm:px-5 dark:border-zinc-800">
        <h2 className="min-w-0 truncate text-base font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="max-h-[calc(100dvh-10rem)] overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
    </dialog>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal title={title} onClose={onClose} size="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
        {error && <Alert>{error}</Alert>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await onConfirm();
              } catch (e) {
                // getErrorMessage reads the API's own message (e.g. why a delete
                // was refused) from RTK Query errors as well as plain Errors.
                setError(getErrorMessage(e));
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

