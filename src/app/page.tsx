"use client";

import Link from "next/link";
import { ArrowRight, Gauge, Timer, TrendingUp } from "lucide-react";
import { MODULES } from "@/data/modules";
import { formatMs, percent, todayKey } from "@/lib/utils";
import { useProgress } from "@/components/drill/progress-context";

export default function DashboardPage() {
  const { progress } = useProgress();
  const modules = Object.values(progress.modules);
  const attempts = modules.reduce((sum, item) => sum + item.attempts, 0);
  const correct = modules.reduce((sum, item) => sum + item.correct, 0);
  const totalResponseMs = modules.reduce((sum, item) => sum + item.totalResponseMs, 0);
  const bestStreak = modules.reduce((best, item) => Math.max(best, item.bestStreak), 0);
  const today = progress.daily[todayKey()] ?? { attempts: 0, correct: 0, totalResponseMs: 0 };
  const weakAreas = Object.entries(progress.weakAreas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg border border-zinc-850 bg-zinc-950/70 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-amber-300/80">Piano Reflex</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-50 sm:text-6xl">
            Build faster musical recognition, one clean rep at a time.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
            A focused dark-mode trainer for keyboard notes, staff notation, triads, scales, the circle of fifths, and core piano language.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Metric icon={<Gauge size={18} />} label="Accuracy" value={percent(correct, attempts)} />
            <Metric icon={<Timer size={18} />} label="Avg response" value={formatMs(attempts ? totalResponseMs / attempts : 0)} />
            <Metric icon={<TrendingUp size={18} />} label="Best streak" value={String(bestStreak)} />
          </div>
        </div>

        <aside className="rounded-lg border border-zinc-850 bg-zinc-950/70 p-6">
          <h2 className="text-lg font-semibold">Today&apos;s progress</h2>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <MiniStat label="Reps" value={String(today.attempts)} />
            <MiniStat label="Accuracy" value={percent(today.correct, today.attempts)} />
            <MiniStat label="Avg" value={formatMs(today.attempts ? today.totalResponseMs / today.attempts : 0)} />
          </div>
          <div className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">Weak areas</h3>
            <div className="mt-3 space-y-2">
              {weakAreas.length ? (
                weakAreas.map(([tag, count]) => (
                  <div key={tag} className="flex items-center justify-between rounded-md border border-zinc-850 bg-zinc-900/60 px-3 py-2">
                    <span className="text-sm text-zinc-300">{tag.replace(":", " · ")}</span>
                    <span className="text-xs font-bold text-amber-300">{count}</span>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-zinc-850 bg-zinc-900/60 px-3 py-3 text-sm text-zinc-500">
                  No weak areas yet. Start a drill and misses or slow answers will appear here.
                </p>
              )}
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((module) => {
          const stats = progress.modules[module.id];
          return (
            <Link
              key={module.id}
              href={`/drill/${module.id}`}
              className="group rounded-lg border border-zinc-850 bg-zinc-950/70 p-5 transition hover:-translate-y-1 hover:border-amber-400/50 hover:bg-zinc-925"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-stone-100">{module.title}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-500">{module.description}</p>
                </div>
                <ArrowRight className="mt-1 text-zinc-600 transition group-hover:text-amber-300" size={19} />
              </div>
              <div className="mt-5 flex items-center gap-4 border-t border-zinc-900 pt-4 text-sm text-zinc-500">
                <span>{stats.attempts} reps</span>
                <span>{percent(stats.correct, stats.attempts)} accuracy</span>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-850 bg-black/35 p-4">
      <div className="flex items-center gap-2 text-zinc-500">
        <span className="text-amber-300">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-850 bg-black/30 p-3">
      <div className="text-xs uppercase tracking-[0.14em] text-zinc-600">{label}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}
