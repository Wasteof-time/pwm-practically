"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { VersionNav } from "../../components/VersionNav";
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
    <div className="mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:px-6">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[22%] bg-card shadow-sm ring-1 ring-black/5 sm:h-12 sm:w-12">
          <Image
            src="/rclogo.webp"
            alt="Robotics Club VITC"
            width={48}
            height={48}
            priority
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[clamp(1.35rem,3vw,2rem)] font-bold leading-none tracking-tight text-foreground">
            PWM Playground
          </h1>
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground sm:text-sm">
            by Robotics Club VITC
          </p>
        </div>
        <VersionNav current="v1" />
      </header>

      {/* Main workspace — fills remaining height */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12 lg:grid-rows-1">
        {/* LEFT — Live signal (stretches full column height) */}
        <section
          className={`${panel} flex min-h-0 min-w-0 flex-col gap-3 lg:col-span-6 lg:h-full`}
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold tracking-tight sm:text-lg">
              Oscilloscope
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

          <div className="relative min-h-[220px] w-full flex-1 overflow-hidden rounded-2xl ring-1 ring-black/5 sm:min-h-[280px]">
            <WaveCanvas
              duty={duty}
              freq={freq}
              playing={playing}
              showAverage={showAverage}
              challengeTarget={challenge?.target ?? null}
              onDutyChange={setDuty}
            />
          </div>
        </section>

        {/* MIDDLE — Duty + demos (same height as scope) */}
        <div className="flex min-h-0 min-w-0 flex-col gap-3 sm:gap-4 lg:col-span-4 lg:h-full">
          <section className={`${panel} shrink-0`}>
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

            <div className="apple-slider mt-5 sm:mt-6">
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

            <div className="mt-4 grid grid-cols-3 gap-2">
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

          <div className="min-h-0 flex-1">
            <DemoDials duty={duty} playing={playing} fill />
          </div>
        </div>

        {/* RIGHT — Readings (matches column height, equal stat rows) */}
        <section
          className={`${panel} flex min-h-0 min-w-0 flex-col gap-2 lg:col-span-2 lg:h-full`}
        >
          <h2 className="shrink-0 text-sm font-semibold tracking-tight text-muted-foreground">
            Readings
          </h2>
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <Stat label="Duty cycle" value={`${duty} %`} />
            <Stat label="Average voltage" value={`${avgV.toFixed(2)} V`} sub="/ 5 V" />
            <Stat label="ON time" value={`${onMs.toFixed(1)} ms`} />
            <Stat label="OFF time" value={`${offMs.toFixed(1)} ms`} />
          </div>
        </section>
      </div>

      {/* Challenges — pinned to bottom of viewport */}
      <section className={`${panel} shrink-0`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold sm:text-lg">Challenges</h2>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {CHALLENGES.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setChallenge(c)}
                  className={`rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition ${
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
              <p className="mt-2 text-sm font-semibold sm:text-base">{challengeMsg}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={reset}
            className="w-full shrink-0 rounded-full border border-transparent bg-secondary px-5 py-2.5 text-sm font-extrabold text-secondary-foreground transition hover:brightness-105 sm:w-auto"
          >
            ↺ Reset
          </button>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center rounded-xl bg-muted px-3 py-2.5 sm:px-3.5 sm:py-3">
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground sm:text-[0.7rem]">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-base font-extrabold tabular-nums leading-tight sm:text-lg">
        {value}
        {sub ? (
          <span className="ml-1 text-xs font-semibold text-muted-foreground sm:text-sm">
            {sub}
          </span>
        ) : null}
      </p>
    </div>
  );
}
