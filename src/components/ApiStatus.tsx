"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Status =
  | { state: "checking" }
  | { state: "connected"; database: string }
  | { state: "error"; message: string };

const DOT_COLOR: Record<Status["state"], string> = {
  checking: "bg-zinc-400",
  connected: "bg-green-500",
  error: "bg-red-500",
};

const LABEL: Record<Status["state"], string> = {
  checking: "Checking…",
  connected: "Connected",
  error: "Unreachable",
};

/**
 * Calls the backend's /api/health from the browser, so a failure here also
 * catches the things a server-side fetch would hide — a wrong
 * NEXT_PUBLIC_API_URL, a backend that isn't running, or CORS rejecting this
 * origin. Delete this component once there are real features to talk to.
 */
export default function ApiStatus() {
  // A missing API URL is known at render time — no need to fetch to find out.
  const [status, setStatus] = useState<Status>(() =>
    API_URL
      ? { state: "checking" }
      : {
          state: "error",
          message:
            "NEXT_PUBLIC_API_URL is not set — copy .env.example to .env.local.",
        },
  );

  useEffect(() => {
    if (!API_URL) return;

    // Abort on unmount so a slow reply can't update an unmounted component.
    const controller = new AbortController();

    fetch(`${API_URL}/api/health`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => null);

        // The backend answers 503 with a JSON body when the DB is down, so the
        // response is still worth reading on a non-OK status.
        if (!res.ok) {
          throw new Error(body?.message ?? `Backend returned ${res.status}`);
        }

        setStatus({
          state: "connected",
          database: body?.database ?? "unknown",
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setStatus({
          state: "error",
          message:
            error instanceof TypeError
              ? `Could not reach ${API_URL} — is iss-be running, and does its CLIENT_URL allow this origin?`
              : error instanceof Error
                ? error.message
                : "Request failed",
        });
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className={`size-2 shrink-0 rounded-full ${DOT_COLOR[status.state]}`}
        />
        <span className="text-sm font-medium text-black dark:text-zinc-50">
          Backend: {LABEL[status.state]}
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {status.state === "connected" ? (
          <>
            Database <span className="font-medium">{status.database}</span> ·{" "}
            <code className="font-mono text-[0.9em]">{API_URL}</code>
          </>
        ) : status.state === "error" ? (
          status.message
        ) : (
          <code className="font-mono text-[0.9em]">{API_URL ?? "no API URL"}</code>
        )}
      </p>
    </div>
  );
}
