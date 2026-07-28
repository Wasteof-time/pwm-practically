"use client";

import { useCallback, useMemo, useState } from "react";
import { DemoDials } from "./DemoDials";
import { WaveCanvas } from "./WaveCanvas";

const FREQS = [
  { label: "Slow", value: 1 },
  { label: "Medium", value: 4 },
  { label: "Fast", value: 20 },
] as const;

const CHALLENGES = [
  { label: "Make the LED half-bright", target: 50 },
  { label: "Make the motor spin slowly", target: 20 },
  { label: "Match this wave", target: 75 },
] as const;

type Challenge = (typeof CHALLENGES)[number];

const panel =
  "rounded-2xl border border-border/80 bg-card p-4 shadow-[var(--panel-shadow)] sm:p-5";
const btn =
  "inline-flex items-center justify-center rounded-full border border-border/90 bg-card px-3.5 py-1.5 text-sm font-semibold text-foreground/90 transition-all duration-200 hover:bg-muted active:scale-[0.98]";
const btnPrimary =
  "inline-flex items-center justify-center rounded-full border border-transparent bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-105 active:scale-[0.98]";

export function PwmPlayground() {
  const [duty, setDuty] = useState(65);
  const [freq, setFreq] = useState(4);
  const [playing, setPlaying] = useState(true);
  const [showAverage, setShowAverage] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  const period = 1000 / freq;
  const onMs = (period * duty) / 100;
  const offMs = period - onMs;
  const avgV = (5 * duty) / 100;

  const challengeMsg = useMemo(() => {
    if (!challenge) return "";
    const diff = Math.abs(duty - challenge.target);
    if (diff <= 3) return "🎉 Nailed it! That's the target duty cycle.";
    return `Target shown as the dashed wave — keep sliding! (you're ${diff}% away)`;
  }, [challenge, duty]);

  const reset = useCallback(() => {
    setDuty(50);
    setFreq(4);
    setPlaying(true);
    setChallenge(null);
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      {/* Header */}
      <header className="mb-4 sm:mb-6">
        <h1 className="text-[clamp(1.5rem,4vw,2.25rem)] font-bold leading-tight tracking-tight text-foreground">
          PWM Playground
        </h1>

      </header>

      {/* Main: scope | controls  — stacks on mobile */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:gap-5">
        {/* LEFT — Live signal */}
        <section
          className={`${panel} flex min-w-0 flex-col gap-6 sm:gap-8 lg:col-span-7`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold tracking-tight sm:text-lg">
              Live signal
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAverage((v) => !v)}
                className={btn}
              >
                {showAverage ? "Hide average" : "Show average"}
              </button>
              <button
                type="button"
                onClick={() => setPlaying((v) => !v)}
                className={btnPrimary}
              >
                {playing ? "⏸ Pause" : "▶ Play"}
              </button>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center py-1 sm:py-2">
            <div className="w-full overflow-hidden rounded-2xl ring-1 ring-black/5">
              <WaveCanvas
                duty={duty}
                freq={freq}
                playing={playing}
                showAverage={showAverage}
                challengeTarget={challenge?.target ?? null}
                onDutyChange={setDuty}
              />
            </div>
          </div>
        </section>

        {/* RIGHT — Duty, demos, stats */}
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-5">
          {/* Duty cycle */}
          <section className={panel}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-base font-semibold tracking-tight sm:text-lg">
                Duty cycle
              </span>
              <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-signal sm:text-4xl">
                {duty}
                <span className="ml-0.5 text-lg font-medium text-signal/70 sm:text-xl">
                  %
                </span>
              </span>
            </div>

            <div className="apple-slider mt-6 sm:mt-7">
              <input
                type="range"
                className="duty-slider"
                min={0}
                max={100}
                value={duty}
                aria-label="Duty cycle"
                onChange={(e) => setDuty(Number(e.target.value))}
                style={{ ["--fill" as string]: `${duty}%` }}
              />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {FREQS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFreq(f.value)}
                  className={`rounded-full border px-2 py-2 text-sm font-semibold transition-all duration-200 sm:px-3 ${
                    freq === f.value
                      ? "border-signal/30 bg-[color-mix(in_oklab,var(--signal)_12%,transparent)] text-signal shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>

          <DemoDials duty={duty} playing={playing} />

          {/* Stats */}
          <section className={`${panel} grid grid-cols-2 gap-2 sm:gap-3`}>
            <Stat label="Duty cycle" value={`${duty} %`} />
            <Stat label="Average voltage" value={`${avgV.toFixed(2)} V / 5 V`} />
            <Stat label="ON time" value={`${onMs.toFixed(1)} ms`} />
            <Stat label="OFF time" value={`${offMs.toFixed(1)} ms`} />
          </section>
        </div>

        {/* Challenges — full width under both columns */}
        <section className={`${panel} lg:col-span-12`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold sm:text-lg">Challenges</h2>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {CHALLENGES.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setChallenge(c)}
                    className={`rounded-xl border-2 px-3 py-2.5 text-left text-sm font-bold transition ${
                      challenge?.label === c.label
                        ? "border-accent bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] text-accent"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {challengeMsg ? (
                <p className="mt-3 text-sm font-bold sm:text-base">{challengeMsg}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={reset}
              className="w-full shrink-0 rounded-full border border-transparent bg-secondary px-5 py-2.5 text-sm font-extrabold text-secondary-foreground transition hover:brightness-105 sm:mt-8 sm:w-auto"
            >
              ↺ Reset
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted px-3 py-2.5 sm:p-3">
      <p className="truncate text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground sm:text-[0.7rem]">
        {label}
      </p>
      <p className="mt-0.5 truncate font-mono text-base font-extrabold tabular-nums sm:text-xl">
        {value}
      </p>
    </div>
  );
}
