import type { Metadata } from "next";
import { ReduxProvider } from "@/lib/redux/provider";

export const metadata: Metadata = {
  title: "ISS Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <ReduxProvider>
      <div className="flex min-h-full min-w-0 flex-1 flex-col overflow-x-clip bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
        {children}
      </div>
    </ReduxProvider>
  );
}
