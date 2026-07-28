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
    <div className="mx-auto min-h-full max-w-6xl px-4 py-6 sm:px-4">
      <header>
        <h1 className="text-[clamp(1.75rem,4vw,2.25rem)] font-bold tracking-tight">
          PWM Playground <span className="text-signal">⚡</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Flip a switch on and off super fast — that&apos;s how we control brightness and
          speed.
        </p>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Live signal */}
        <section className="rounded-[calc(var(--radius)+8px)] border-2 border-border bg-card p-5 shadow-[var(--panel-shadow)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Live signal</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAverage((v) => !v)}
                className="rounded-[calc(var(--radius)+4px)] border-2 border-border bg-transparent px-3.5 py-1.5 font-bold hover:bg-muted"
              >
                {showAverage ? "Hide" : "Show"} average
              </button>
              <button
                type="button"
                onClick={() => setPlaying((v) => !v)}
                className="rounded-[calc(var(--radius)+4px)] border-2 border-transparent bg-primary px-3.5 py-1.5 font-extrabold text-primary-foreground hover:brightness-105"
              >
                {playing ? "⏸ Pause" : "▶ Play"}
              </button>
            </div>
          </div>
          <WaveCanvas
            duty={duty}
            freq={freq}
            playing={playing}
            showAverage={showAverage}
            challengeTarget={challenge?.target ?? null}
            onDutyChange={setDuty}
          />
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Tip: drag right on the wave to make the ON part wider.
          </p>
        </section>

        {/* Right column */}
        <section className="flex flex-col gap-5">
          {/* Duty cycle */}
          <div className="rounded-[calc(var(--radius)+8px)] border-2 border-border bg-card p-5 shadow-[var(--panel-shadow)]">
            <div className="flex items-end justify-between">
              <span className="text-lg font-bold">Duty cycle</span>
              <span className="font-mono text-5xl font-extrabold leading-none text-signal">
                {duty}%
              </span>
            </div>
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
            <div className="mt-5 flex gap-2">
              {FREQS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFreq(f.value)}
                  className={`flex-1 rounded-[calc(var(--radius)+4px)] border-2 px-3.5 py-1.5 font-bold hover:bg-muted ${
                    freq === f.value
                      ? "border-signal bg-[color-mix(in_oklab,var(--signal)_15%,transparent)] text-signal"
                      : "border-border bg-transparent"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <DemoDials duty={duty} playing={playing} />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 rounded-[calc(var(--radius)+8px)] border-2 border-border bg-card p-5 font-mono shadow-[var(--panel-shadow)]">
            <Stat label="Duty cycle" value={`${duty} %`} />
            <Stat label="Average voltage" value={`${avgV.toFixed(2)} V / 5 V`} />
            <Stat label="ON time" value={`${onMs.toFixed(1)} ms`} />
            <Stat label="OFF time" value={`${offMs.toFixed(1)} ms`} />
          </div>
        </section>
      </div>

      {/* Challenges */}
      <div className="mt-5 rounded-[calc(var(--radius)+8px)] border-2 border-border bg-card p-5 shadow-[var(--panel-shadow)] lg:max-w-md lg:ml-auto">
        <h2 className="text-lg font-bold">Challenges</h2>
        <div className="mt-3 flex flex-col gap-2">
          {CHALLENGES.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setChallenge(c)}
              className={`w-full rounded-[calc(var(--radius)+4px)] border-2 px-3.5 py-1.5 text-left font-bold hover:bg-muted ${
                challenge?.label === c.label
                  ? "border-accent bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] text-accent"
                  : "border-border bg-transparent"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {challengeMsg ? <p className="mt-3 font-bold">{challengeMsg}</p> : null}
        <button
          type="button"
          onClick={reset}
          className="mt-4 w-full rounded-[calc(var(--radius)+4px)] border-2 border-transparent bg-secondary px-3.5 py-1.5 font-extrabold text-secondary-foreground hover:brightness-105"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-xl font-extrabold">{value}</p>
    </div>
  );
}
