"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { adminSections } from "@/lib/admin/resources";
import type { QueryState } from "@/lib/admin/resource";
import type { ListArgs, ListResult } from "@/lib/redux/api";
import { useGetInquiriesQuery } from "@/lib/redux/features/contact/contactApi";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Everything shown on the website, in one place.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          href="/admin/inquiries"
          title="Inquiries"
          description="Messages from the Contact Us page."
          useAdminList={useGetInquiriesQuery}
        />
        {adminSections.map(({ href, config }) => (
          <StatCard
            key={href}
            href={href}
            title={config.title}
            description={config.description}
            useAdminList={config.api.useAdminList}
          />
        ))}
      </div>
    </div>
  );
}

// One component per card so each can call its section's list hook.
// page 1 / limit 1 is enough: paginated endpoints report the total.
function StatCard({
  href,
  title,
  description,
  useAdminList,
}: {
  href: string;
  title: string;
  description: string;
  useAdminList: (arg: ListArgs) => QueryState<ListResult<unknown>>;
}) {
  const { data, error } = useAdminList({ page: 1, limit: 1 });

  return (
    <Link
      href={href}
      className="group rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-500">{title}</span>
        <ArrowRight className="size-4 text-zinc-400 transition group-hover:translate-x-0.5" aria-hidden />
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums">{data ? data.total : error ? "—" : "…"}</div>
      <p className="mt-1 text-xs text-zinc-500">{description}</p>
    </Link>
  );
}
