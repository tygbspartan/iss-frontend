"use client";

import { useEffect, useState } from "react";
import { Building2, CalendarDays, ChevronLeft, ChevronRight, Loader2, Mail, Phone, Search } from "lucide-react";
import { useGetInquiriesQuery, useGetInquiryQuery } from "@/lib/redux/features/contact/contactApi";
import { getErrorMessage } from "@/lib/redux/errors";
import { formatDateTime, truncate } from "@/lib/admin/format";
import { Alert, Button, inputClass, Modal, Spinner } from "@/components/admin/ui";

const PAGE_SIZE = 20;

// The event's day ("YYYY-MM-DD", no time), e.g. "Mon, 15 Dec 2026". Formatted
// in UTC so the day never shifts with the viewer's timezone. Older inquiries
// have none.
const eventDateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const formatEventDate = (date: string | null) => (date ? eventDateFormat.format(new Date(`${date}T00:00:00Z`)) : "—");

// Read-only inbox for the public "Contact Us" form. There is deliberately no
// edit or delete — the API doesn't offer either.
export default function InquiriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState(""); // debounced search sent to the API
  const [openId, setOpenId] = useState<string | null>(null);

  // Wait for a pause in typing before searching.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, error, isLoading, isFetching } = useGetInquiriesQuery({ page, limit: PAGE_SIZE, q });

  if (data && page > data.totalPages) setPage(data.totalPages);

  const filtered = !!q;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Inquiries</h1>
        <p className="mt-1 text-sm text-zinc-500">Messages sent from the Contact Us page, newest first.</p>
      </header>

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 p-3 dark:border-zinc-800">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, email, phone, event…"
              aria-label="Search inquiries"
              className={`${inputClass} pl-8`}
            />
          </div>
          <span className="ml-auto flex shrink-0 items-center gap-2 text-sm text-zinc-500">
            {isFetching && !isLoading && <Loader2 className="size-3.5 animate-spin" aria-label="Refreshing" />}
            {data?.total ?? 0} {filtered ? "found" : "total"}
          </span>
        </div>

        {error && !data ? (
          <div className="p-4">
            <Alert>{getErrorMessage(error)}</Alert>
          </div>
        ) : !data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-zinc-500">
            {filtered ? "No inquiries match this search." : "No inquiries yet."}
          </div>
        ) : (
          <>
            {/* Phones: cards */}
            <ul className="divide-y divide-zinc-200 sm:hidden dark:divide-zinc-800">
              {data.items.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => setOpenId(item.id)} className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-medium">{item.name}</span>
                      <span className="shrink-0 text-xs text-zinc-500">{formatDateTime(item.createdAt)}</span>
                    </div>
                    {item.company && <div className="mt-0.5 truncate text-sm text-zinc-500">{item.company}</div>}
                    <div className="mt-0.5 truncate text-sm text-zinc-500">
                      {item.eventType} · {formatEventDate(item.eventDate)}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{item.requirements}</div>
                  </button>
                </li>
              ))}
            </ul>

            {/* Tablet and up: table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">From</th>
                    <th className="hidden px-4 py-2.5 font-medium md:table-cell">Company</th>
                    <th className="px-4 py-2.5 font-medium">Type of event</th>
                    <th className="hidden px-4 py-2.5 font-medium md:table-cell">Event date</th>
                    <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Requirements</th>
                    <th className="px-4 py-2.5 font-medium">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {data.items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setOpenId(item.id)}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    >
                      <td className="px-4 py-3">
                        {/* Real button inside the row so it's keyboard-accessible. */}
                        <button type="button" onClick={() => setOpenId(item.id)} className="max-w-[16rem] text-left">
                          <div className="truncate font-medium">{item.name}</div>
                          <div className="truncate text-xs text-zinc-500">{item.email}</div>
                        </button>
                      </td>
                      <td className="hidden max-w-[12rem] truncate px-4 py-3 text-zinc-600 md:table-cell dark:text-zinc-400">{item.company || "—"}</td>
                      <td className="max-w-[14rem] truncate px-4 py-3 text-zinc-600 dark:text-zinc-400">{item.eventType}</td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-zinc-600 md:table-cell dark:text-zinc-400">{formatEventDate(item.eventDate)}</td>
                      <td className="hidden max-w-xs px-4 py-3 text-zinc-600 lg:table-cell dark:text-zinc-400">{truncate(item.requirements, 70)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatDateTime(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800">
            <span className="text-zinc-500">
              Page {page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                <ChevronLeft className="size-4" aria-hidden /> Previous
              </Button>
              <Button variant="secondary" onClick={() => setPage(page + 1)} disabled={page >= data.totalPages}>
                Next <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </div>

      {openId && <InquiryDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function InquiryDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: item, error, isLoading } = useGetInquiryQuery(id);

  return (
    <Modal title={item ? item.name : "Inquiry"} onClose={onClose}>
      {isLoading ? (
        <Spinner />
      ) : !item ? (
        <Alert>{error ? getErrorMessage(error) : "Inquiry not found"}</Alert>
      ) : (
        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap gap-2">
            <a
              href={`mailto:${item.email}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <Mail className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{item.email}</span>
            </a>
            <a
              href={`tel:${item.phone.replace(/[^\d+]/g, "")}`}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <Phone className="size-4" aria-hidden />
              {item.phone}
            </a>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Detail label="Company / organization">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Building2 className="size-4 shrink-0 text-zinc-400" aria-hidden />
                <span className="wrap-anywhere">{item.company || "—"}</span>
              </span>
            </Detail>
            <Detail label="Type of event">
              <span className="wrap-anywhere">{item.eventType}</span>
            </Detail>
            <Detail label="Event date">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4 text-zinc-400" aria-hidden />
                {formatEventDate(item.eventDate)}
              </span>
            </Detail>
          </dl>

          <Detail label="Requirements">
            <p className="whitespace-pre-wrap wrap-anywhere leading-6">{item.requirements}</p>
          </Detail>

          <p className="border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
            Received {formatDateTime(item.createdAt)}
          </p>
        </div>
      )}
    </Modal>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  );
}
