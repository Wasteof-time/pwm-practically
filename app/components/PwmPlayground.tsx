"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { DemoDials } from "./DemoDials";
import { WaveCanvas } from "./WaveCanvas";

const FREQ_MIN = 1;
const FREQ_MAX = 20;
const AMP_MIN = 3;
const AMP_MAX = 15;
const AMP_DEFAULT = 5;
/** Full-scale average used for LED/motor demos (matches scope). */
const AMP_SCALE_MAX = 15;

/**
 * Challenges:
 * - avgV: hit a target average voltage (duty adjusts when amplitude changes)
 * - duty: match a fixed duty cycle on the dashed wave
 */
const CHALLENGES = [
  {
    id: "led-half",
    label: "Make the LED half-bright",
    mode: "avgV" as const,
    /** Half of max brightness → 50% of 15 V scale */
    targetAvgV: AMP_SCALE_MAX * 0.5,
  },
  {
    id: "motor-slow",
    label: "Make the motor spin slowly",
    mode: "avgV" as const,
    /** ~20% of max drive (same idea as the old 20% duty challenge) */
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
        return `Raise amplitude to at least ${targetV.toFixed(1)} V — then set duty near ${dutyForTargetAvgV(targetV, Math.max(amplitude, targetV))}%.`;
      }
      const vDiff = Math.abs(avgV - targetV);
      if (vDiff <= 0.3) {
        return `🎉 Nailed it! Average voltage is ~${targetV.toFixed(1)} V.`;
      }
      return `Target V_avg ${targetV.toFixed(1)} V → duty ~${challengeDuty}% at ${amplitude.toFixed(1)} V peak (you're ${vDiff.toFixed(2)} V away).`;
    }

    // Fixed duty-cycle wave match
    const dDiff = Math.abs(duty - challenge.targetDuty);
    if (dDiff <= 3) return "🎉 Nailed it! That's the target duty cycle.";
    return `Target duty ${challenge.targetDuty}% — keep sliding! (you're ${dDiff}% away)`;
  }, [challenge, challengeDuty, amplitude, avgV, duty]);

  const reset = useCallback(() => {
    setDuty(50);
    setFreq(4);
    setAmplitude(AMP_DEFAULT);
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

            {/* Amplitude — peak ON voltage (scope height) */}
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold tracking-tight sm:text-base">
                  Amplitude
                </span>
                <span className="font-mono text-xl font-semibold tabular-nums tracking-tight text-primary sm:text-2xl">
                  {amplitude.toFixed(1)}
                  <span className="ml-0.5 text-sm font-medium text-primary/70 sm:text-base">
                    V
                  </span>
                </span>
              </div>
              <div className="apple-slider mt-3 sm:mt-4">
                <input
                  type="range"
                  className="duty-slider"
                  min={AMP_MIN}
                  max={AMP_MAX}
                  step={0.1}
                  value={amplitude}
                  aria-label="Amplitude"
                  onChange={(e) => setAmplitude(Number(e.target.value))}
                  style={{
                    ["--fill" as string]: `${
                      ((amplitude - AMP_MIN) / (AMP_MAX - AMP_MIN)) * 100
                    }%`,
                  }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[0.6rem] font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{AMP_MIN} V</span>
                <span>{AMP_MAX} V</span>
              </div>
            </div>
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
            <Stat label="Amplitude" value={`${amplitude.toFixed(1)} V`} />
            <Stat
              label="Average voltage"
              value={`${avgV.toFixed(2)} V`}
              sub={`/ ${amplitude.toFixed(1)} V`}
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
                const neededDuty = challengeTargetDuty(c, amplitude);
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
                    <span className="block">{c.label}</span>
                    <span
                      className={`mt-0.5 block text-[0.7rem] font-medium ${
                        active ? "text-accent/80" : "text-muted-foreground"
                      }`}
                    >
                      {c.mode === "avgV"
                        ? `Target ${c.targetAvgV.toFixed(1)} V_avg · duty ~${neededDuty}%`
                        : `Target duty ${c.targetDuty}%`}
                    </span>
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
