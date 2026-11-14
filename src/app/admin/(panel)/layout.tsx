"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  CalendarDays,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Speaker,
  Users,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useGetMeQuery } from "@/lib/redux/features/auth/authApi";
import { loggedOut, userRefreshed } from "@/lib/redux/features/auth/authSlice";
import { Spinner } from "@/components/admin/ui";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/services", label: "Services", icon: Speaker },
  { href: "/admin/projects", label: "Projects", icon: Briefcase },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/blogs", label: "Blogs", icon: FileText },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/clients", label: "Clients", icon: Building2 },
  { href: "/admin/upcoming-events", label: "Upcoming Events", icon: CalendarDays },
];

// Client-side guard for every admin page except /admin/login. This only
// controls what the browser shows — the API enforces admin access itself.
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const { status, user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const logout = () => dispatch(loggedOut());

  // Re-check a restored session with the server once per visit. A revoked or
  // expired token answers 401, which logs out via baseQuery.
  const { data: me } = useGetMeQuery(undefined, { skip: status !== "authenticated" });
  useEffect(() => {
    if (!me) return;
    if (me.role !== "admin") dispatch(loggedOut());
    else dispatch(userRefreshed(me));
  }, [me, dispatch]);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "anonymous") router.replace("/admin/login");
  }, [status, router]);

  if (status !== "authenticated" || !user) return <Spinner />;

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const nav = (
    <nav className="space-y-1" aria-label="Admin">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setMenuOpen(false)}
          aria-current={isActive(href) ? "page" : undefined}
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
            isActive(href)
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          }`}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );

  const account = (
    <div className="flex items-center justify-between gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <div className="min-w-0 text-sm">
        <div className="truncate font-medium">{user.username}</div>
        <div className="text-xs text-zinc-500">Administrator</div>
      </div>
      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <LogOut className="size-4" aria-hidden />
        Log out
      </button>
    </div>
  );

  return (
    <div className="flex flex-1">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col justify-between border-r border-zinc-200 bg-white p-4 lg:flex dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <Link href="/admin" className="mb-6 block px-3 text-lg font-semibold tracking-tight">
            ISS Admin
          </Link>
          {nav}
        </div>
        {account}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <Link href="/admin" className="font-semibold tracking-tight">
            ISS Admin
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </header>
        {menuOpen && (
          <div className="space-y-4 border-b border-zinc-200 bg-white p-4 lg:hidden dark:border-zinc-800 dark:bg-zinc-950">
            {nav}
            {account}
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
