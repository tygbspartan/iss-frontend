import ApiStatus from "@/components/ApiStatus";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-24 font-sans dark:bg-black">
      <main className="w-full max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          ISS
        </h1>
        <p className="mt-3 mb-8 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Frontend skeleton. Edit{" "}
          <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
            src/app/page.tsx
          </code>{" "}
          to get started.
        </p>
        <ApiStatus />
      </main>
    </div>
  );
}
