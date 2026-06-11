import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ProgressProvider } from "@/components/drill/progress-context";
import { AmbientCanvas } from "@/components/fx/ambient-canvas";
import { LogoGlyph } from "@/components/ui/logo";
import { SoundToggle } from "@/components/ui/sound-toggle";
import { MODULES } from "@/data/modules";
import "@fontsource-variable/fraunces/index.css";
import "@fontsource-variable/instrument-sans/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Piano Reflex",
  description: "Train instant recall of keys, staves, chords, and scales.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AmbientCanvas />
        <div className="grain" aria-hidden />
        <ProgressProvider>
          <div className="min-h-screen">
            <header className="sticky top-0 z-40">
              <div className="glass">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                  <Link href="/" className="group flex items-center gap-3">
                    <LogoGlyph className="h-7 w-7 text-brass transition-transform duration-300 group-hover:scale-105" />
                    <span className="font-display text-[17px] font-semibold tracking-tight text-ivory">
                      Piano Reflex
                    </span>
                  </Link>
                  <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Drills">
                    {MODULES.map((module) => (
                      <Link
                        key={module.id}
                        href={`/drill/${module.id}`}
                        className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-bone transition-colors duration-200 hover:bg-ivory/5 hover:text-ivory"
                      >
                        {module.shortTitle}
                      </Link>
                    ))}
                  </nav>
                  <div className="flex items-center gap-2">
                    <SoundToggle />
                    <Link
                      href="/drill/keyboard-notes"
                      className="hidden items-center rounded-full bg-ivory px-4 py-1.5 text-[13px] font-semibold text-ink transition-all duration-200 hover:bg-brass sm:inline-flex"
                    >
                      Practice
                    </Link>
                  </div>
                </div>
              </div>
            </header>
            {children}
          </div>
        </ProgressProvider>
      </body>
    </html>
  );
}
