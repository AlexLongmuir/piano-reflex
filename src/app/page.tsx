"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CountUp } from "@/components/fx/count-up";
import { ModuleGlyph } from "@/components/ui/module-glyphs";
import { useProgress } from "@/components/drill/progress-context";
import { MODULES } from "@/data/modules";
import { musicLabel, todayKey } from "@/lib/utils";

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
    .slice(0, 4);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
      <section className="rise-in">
        <p className="label-caps">Reaction trainer</p>
        <h1 className="mt-4 max-w-2xl font-display text-[40px] font-medium leading-[1.06] tracking-[-0.02em] text-ivory sm:text-6xl">
          Recall, faster than&nbsp;thought.
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-7 text-bone">
          Short, focused drills for keys, staves, chords, scales, and the circle of fifths —
          until naming a note feels like a reflex, not a calculation.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-6 sm:flex sm:flex-wrap sm:items-stretch sm:gap-x-10">
          <HeroStat label="Accuracy" value={attempts ? (correct / attempts) * 100 : 0} format={(v) => `${Math.round(v)}%`} />
          <Divider />
          <HeroStat
            label="Avg response"
            value={attempts ? totalResponseMs / attempts / 1000 : 0}
            format={(v) => `${v.toFixed(1)}s`}
          />
          <Divider />
          <HeroStat label="Best streak" value={bestStreak} />
          <Divider />
          <HeroStat label="Reps today" value={today.attempts} />
        </div>
      </section>

      <section className="mt-16 sm:mt-20">
        <div className="flex items-baseline justify-between">
          <h2 className="label-caps">Drills</h2>
          {weakAreas.length > 0 && (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs text-bone/70">Needs work</span>
              {weakAreas.map(([tag, count]) => (
                <span
                  key={tag}
                  className="rounded-full border border-felt/30 bg-felt/10 px-2.5 py-1 text-xs font-medium text-ivory/80"
                >
                  {prettyTag(tag)} <span className="tnum text-felt">×{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module, index) => {
            const stats = progress.modules[module.id];
            return (
              <Link
                key={module.id}
                href={`/drill/${module.id}`}
                className="surface group relative overflow-hidden p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-ivory/15"
                style={{ animation: `rise-in 0.5s var(--ease-out-soft) ${90 + index * 60}ms both` }}
              >
                <div className="flex items-start justify-between">
                  <div className="h-11 w-11 text-bone transition-colors duration-300 group-hover:text-brass">
                    <ModuleGlyph id={module.id} />
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-bone/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brass"
                  />
                </div>
                <h3 className="mt-5 font-display text-xl font-medium tracking-tight text-ivory">
                  {module.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-6 text-bone">{module.description}</p>
                <div className="hairline-t mt-5 flex items-center gap-5 pt-4 text-xs text-bone/80">
                  <span className="tnum">{stats.attempts} reps</span>
                  <span className="tnum">
                    {stats.attempts ? Math.round((stats.correct / stats.attempts) * 100) : 0}% right
                  </span>
                  {stats.bestStreak > 0 && <span className="tnum">streak {stats.bestStreak}</span>}
                </div>
                <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-brass/70 transition-transform duration-500 ease-out group-hover:scale-x-100" />
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function HeroStat({
  label,
  value,
  format,
}: {
  label: string;
  value: number;
  format?: (value: number) => string;
}) {
  return (
    <div>
      <div className="font-display text-[28px] font-medium tracking-tight text-ivory sm:text-[32px]">
        <CountUp value={value} format={format} />
      </div>
      <div className="label-caps mt-1">{label}</div>
    </div>
  );
}

function Divider() {
  return <span className="hidden w-px self-stretch bg-ivory/8 sm:block" aria-hidden />;
}

function prettyTag(tag: string) {
  const [, detail] = tag.split(":");
  return musicLabel(detail ?? tag);
}
