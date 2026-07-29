"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import boardExamples from "@/data.json";
import { DemoDials } from "./DemoDials";
import { WaveCanvas } from "./WaveCanvas";

const FREQ_MIN = 1;
const FREQ_MAX = 20;

/** Common logic-level / motor supply rails (radio pick). */
const SUPPLY_RAILS = [
  { label: "3.3 V", value: 3.3, dataKey: "3.3V" as const },
  { label: "5 V", value: 5, dataKey: "5V" as const },
  { label: "12 V", value: 12, dataKey: "12V" as const },
] as const;

type BoardDataKey = (typeof SUPPLY_RAILS)[number]["dataKey"];

const BOARD_DATA = boardExamples as Record<BoardDataKey, string[]>;

const AMP_DEFAULT = 5;
/** Scope + drive full-scale (slightly above 12 V rail). */
const AMP_SCALE_MAX = 13;

/**
 * Challenges:
 * - avgV: hit a target average voltage (duty adjusts when supply rail changes)
 * - duty: match a fixed duty cycle on the dashed wave
 */
const CHALLENGES = [
  {
    id: "led-half",
    label: "Make the LED half-bright",
    mode: "avgV" as const,
    /** Half of max brightness on the 13 V scale */
    targetAvgV: AMP_SCALE_MAX * 0.5,
  },
  {
    id: "motor-slow",
    label: "Make the motor spin slowly",
    mode: "avgV" as const,
    /** ~20% of max drive */
    targetAvgV: AMP_SCALE_MAX * 0.2,
  },
  {
    id: "match-wave",
    label: "Match this wave",
    mode: "duty" as const,
    targetDuty: 75,
  },
] as const;

type Challenge = (typeof CHALLENGES)[number];

/** Duty % needed for target average voltage at the current amplitude. */
function dutyForTargetAvgV(targetAvgV: number, amp: number): number {
  if (amp <= 0) return 0;
  return Math.round(Math.min(100, Math.max(0, (targetAvgV / amp) * 100)));
}

function challengeTargetDuty(c: Challenge, amp: number): number {
  if (c.mode === "avgV") return dutyForTargetAvgV(c.targetAvgV, amp);
  return c.targetDuty;
}

const panel =
  "rounded-2xl border border-border/80 bg-card p-4 shadow-[var(--panel-shadow)] sm:p-5";
const btn =
  "inline-flex items-center justify-center rounded-full border border-border/90 bg-card px-3.5 py-1.5 text-sm font-semibold text-foreground/90 transition-all duration-200 hover:bg-muted active:scale-[0.98]";
const btnPrimary =
  "inline-flex items-center justify-center rounded-full border border-transparent bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-105 active:scale-[0.98]";

export function PwmPlayground() {
  const [duty, setDuty] = useState(65);
  const [freq, setFreq] = useState(4);
  const [amplitude, setAmplitude] = useState(AMP_DEFAULT);
  const [playing, setPlaying] = useState(true);
  const [showAverage, setShowAverage] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  const period = 1000 / freq;
  const onMs = (period * duty) / 100;
  const offMs = period - onMs;
  const avgV = (amplitude * duty) / 100;

  /** Duty the dashed target wave should show (updates with amplitude for avgV challenges). */
  const challengeDuty = useMemo(() => {
    if (!challenge) return null;
    return challengeTargetDuty(challenge, amplitude);
  }, [challenge, amplitude]);

  const challengeMsg = useMemo(() => {
    if (!challenge || challengeDuty == null) return "";

    if (challenge.mode === "avgV") {
      const targetV = challenge.targetAvgV;
      // Need peak ≥ target average, otherwise impossible even at 100% duty
      if (amplitude + 1e-6 < targetV) {
        return `Try a higher supply rail, then set duty near ${dutyForTargetAvgV(targetV, Math.max(amplitude, targetV))}%.`;
      }
      const vDiff = Math.abs(avgV - targetV);
      if (vDiff <= 0.3) {
        return "🎉 Nailed it!";
      }
      const dDiff = Math.abs(duty - challengeDuty);
      return `Aim for duty ~${challengeDuty}% on this supply (you're ${dDiff}% away).`;
    }

    // Fixed duty-cycle wave match
    const dDiff = Math.abs(duty - challenge.targetDuty);
    if (dDiff <= 3) return "🎉 Nailed it!";
    return `Aim for duty ${challenge.targetDuty}% (you're ${dDiff}% away).`;
  }, [challenge, challengeDuty, amplitude, avgV, duty]);

  const reset = useCallback(() => {
    setDuty(50);
    setFreq(4);
    setAmplitude(AMP_DEFAULT);
    setPlaying(true);
    setChallenge(null);
  }, []);

  const supplyKey: BoardDataKey =
    SUPPLY_RAILS.find((r) => Math.abs(r.value - amplitude) < 0.01)?.dataKey ??
    "5V";
  const exampleBoards = BOARD_DATA[supplyKey] ?? [];

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
        <div className="min-w-0">
          <h1 className="text-[clamp(1.35rem,3vw,2rem)] font-bold leading-none tracking-tight text-foreground">
            PWM Playground
          </h1>
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground sm:text-sm">
            by Robotics Club VITC
          </p>
        </div>
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
              amplitude={amplitude}
              playing={playing}
              showAverage={showAverage}
              challengeTarget={challengeDuty}
              onDutyChange={setDuty}
            />
          </div>
        </section>

        {/* MIDDLE — Duty, frequency, compact demos */}
        <div className="flex min-h-0 min-w-0 flex-col gap-3 sm:gap-3 lg:col-span-4 lg:h-full">
          <section className={`${panel} shrink-0 space-y-4 sm:space-y-5`}>
            {/* Duty cycle */}
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold tracking-tight sm:text-base">
                  Duty cycle
                </span>
                <span className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-signal sm:text-3xl">
                  {duty}
                  <span className="ml-0.5 text-sm font-medium text-signal/70 sm:text-base">
                    %
                  </span>
                </span>
              </div>
              <div className="apple-slider mt-3 sm:mt-4">
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
            </div>

            {/* Frequency — packs / spreads waves on the scope */}
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold tracking-tight sm:text-base">
                  Frequency
                </span>
                <span className="font-mono text-xl font-semibold tabular-nums tracking-tight text-accent sm:text-2xl">
                  {freq}
                  <span className="ml-0.5 text-sm font-medium text-accent/70 sm:text-base">
                    Hz
                  </span>
                </span>
              </div>
              <div className="apple-slider mt-3 sm:mt-4">
                <input
                  type="range"
                  className="duty-slider"
                  min={FREQ_MIN}
                  max={FREQ_MAX}
                  step={1}
                  value={freq}
                  aria-label="Frequency"
                  onChange={(e) => setFreq(Number(e.target.value))}
                  style={{
                    ["--fill" as string]: `${
                      ((freq - FREQ_MIN) / (FREQ_MAX - FREQ_MIN)) * 100
                    }%`,
                  }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[0.6rem] font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Farther</span>
                <span>Closer</span>
              </div>
            </div>

            {/* Supply rail — discrete real-world amplitudes */}
            <div>
              <span className="text-sm font-semibold tracking-tight sm:text-base">
                Supply
              </span>
              <div
                className="mt-2 grid grid-cols-3 gap-2"
                role="radiogroup"
                aria-label="Supply voltage"
              >
                {SUPPLY_RAILS.map((rail) => {
                  const selected = Math.abs(amplitude - rail.value) < 0.01;
                  return (
                    <label
                      key={rail.value}
                      className={`flex cursor-pointer items-center justify-center rounded-full border px-2 py-2 text-sm font-semibold transition-all duration-200 ${
                        selected
                          ? "border-primary/40 bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-primary shadow-sm"
                          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name="supply-rail"
                        value={rail.value}
                        checked={selected}
                        onChange={() => setAmplitude(rail.value)}
                        className="sr-only"
                      />
                      {rail.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Example boards for the selected supply rail */}
          <section className="shrink-0 rounded-2xl border border-border/80 bg-card px-3 py-2.5 shadow-[var(--panel-shadow)] sm:px-3.5 sm:py-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
              Example {formatRail(amplitude)} boards
            </p>
            <p className="mt-1.5 max-h-[4.5rem] overflow-y-auto text-[0.65rem] leading-relaxed text-muted-foreground sm:max-h-[5.25rem] sm:text-[0.7rem]">
              {exampleBoards.join(" · ")}
            </p>
          </section>

          <div className="min-h-0 flex-1">
            <DemoDials duty={duty} amplitude={amplitude} playing={playing} />
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
            <Stat label="Frequency" value={`${freq} Hz`} />
            <Stat label="Supply" value={formatRail(amplitude)} />
            <Stat
              label="Average voltage"
              value={`${avgV.toFixed(2)} V`}
              sub={`/ ${formatRail(amplitude)}`}
            />
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
              {CHALLENGES.map((c) => {
                const active = challenge?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChallenge(c)}
                    className={`rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition ${
                      active
                        ? "border-accent bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] text-accent"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
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

function formatRail(v: number): string {
  if (Math.abs(v - 3.3) < 0.01) return "3.3 V";
  if (Math.abs(v - 5) < 0.01) return "5 V";
  if (Math.abs(v - 12) < 0.01) return "12 V";
  return `${v} V`;
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
