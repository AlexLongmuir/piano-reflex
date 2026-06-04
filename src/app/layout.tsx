import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Piano } from "lucide-react";
import { ProgressProvider } from "@/components/drill/progress-context";
import { MODULES } from "@/data/modules";
import "./globals.css";

export const metadata: Metadata = {
  title: "Piano Reflex",
  description: "A dark, focused piano theory reaction trainer.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ProgressProvider>
          <div className="min-h-screen bg-[#090908] text-stone-100">
            <header className="sticky top-0 z-20 border-b border-zinc-900/90 bg-[#090908]/92 backdrop-blur">
              <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-amber-400/30 bg-amber-400/10 text-amber-300">
                    <Piano size={21} />
                  </span>
                  <span>
                    <span className="block text-base font-semibold tracking-tight">Piano Reflex</span>
                    <span className="block text-xs text-zinc-500">reaction theory trainer</span>
                  </span>
                </Link>
                <nav className="hidden items-center gap-1 lg:flex">
                  {MODULES.map((module) => (
                    <Link
                      key={module.id}
                      href={`/drill/${module.id}`}
                      className="rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-stone-100"
                    >
                      {module.shortTitle}
                    </Link>
                  ))}
                </nav>
                <Link
                  href="/drill/keyboard-notes"
                  className="inline-flex items-center gap-2 rounded-md bg-amber-300 px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-amber-200"
                >
                  <Activity size={16} />
                  Start drill
                </Link>
              </div>
            </header>
            {children}
          </div>
        </ProgressProvider>
      </body>
    </html>
  );
}
