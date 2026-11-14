"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useLoginMutation } from "@/lib/redux/features/auth/authApi";
import { credentialsReceived } from "@/lib/redux/features/auth/authSlice";
import { getErrorMessage, getErrorStatus } from "@/lib/redux/errors";
import { Alert, Button, inputClass, Spinner } from "@/components/admin/ui";

export default function AdminLoginPage() {
  const status = useAppSelector((s) => s.auth.status);
  const dispatch = useAppDispatch();
  const [login, { isLoading: submitting }] = useLoginMutation();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Already signed in (or just signed in) → go to the dashboard.
  useEffect(() => {
    if (status === "authenticated") router.replace("/admin");
  }, [status, router]);

  if (status !== "anonymous") return <Spinner />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const credentials = await login({ username: username.trim(), password }).unwrap();
      if (credentials.user.role !== "admin") {
        setError("This account does not have admin access.");
        return;
      }
      dispatch(credentialsReceived(credentials));
    } catch (err) {
      setError(
        getErrorStatus(err) === 429
          ? "Too many login attempts. Please wait 15 minutes and try again."
          : getErrorMessage(err),
      );
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <Lock className="size-5" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin sign in</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage the ISS website content.</p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          {error && <Alert>{error}</Alert>}
          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <Button type="submit" loading={submitting} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </main>
  );
}
