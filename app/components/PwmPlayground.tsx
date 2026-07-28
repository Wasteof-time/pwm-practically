"use client";

import { useCallback, useMemo, useState } from "react";
import { ControlSlider } from "./ControlSlider";
import { Oscilloscope } from "./Oscilloscope";

const DEFAULT_DUTY = 50;
const DEFAULT_FREQ = 1000; // 1 kHz
const DEFAULT_AMPLITUDE = 5; // 5 V

function formatFreq(hz: number): string {
  if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(2)} MHz`;
  if (hz >= 1000) return `${(hz / 1000).toFixed(hz >= 10000 ? 1 : 2)} kHz`;
  if (hz >= 10) return `${hz.toFixed(0)} Hz`;
  return `${hz.toFixed(1)} Hz`;
}

function formatPeriod(seconds: number): string {
  if (seconds >= 1) return `${seconds.toFixed(3)} s`;
  if (seconds >= 1e-3) return `${(seconds * 1e3).toFixed(3)} ms`;
  if (seconds >= 1e-6) return `${(seconds * 1e6).toFixed(2)} µs`;
  return `${(seconds * 1e9).toFixed(1)} ns`;
}

function formatTimeShort(seconds: number): string {
  if (seconds >= 1) return `${seconds.toFixed(2)} s`;
  if (seconds >= 1e-3) return `${(seconds * 1e3).toFixed(2)} ms`;
  if (seconds >= 1e-6) return `${(seconds * 1e6).toFixed(1)} µs`;
  return `${(seconds * 1e9).toFixed(0)} ns`;
}

/** Log-ish period slider: map 0–100 → period range corresponding to 1 Hz … 100 kHz */
const FREQ_MIN = 1;
const FREQ_MAX = 100_000;

export function PwmPlayground() {
  const [dutyCycle, setDutyCycle] = useState(DEFAULT_DUTY);
  const [frequency, setFrequency] = useState(DEFAULT_FREQ);
  const [amplitude, setAmplitude] = useState(DEFAULT_AMPLITUDE);
  const [animate, setAnimate] = useState(true);
  const [periodsVisible, setPeriodsVisible] = useState(3);

  const period = useMemo(
    () => (frequency > 0 ? 1 / frequency : 0),
    [frequency],
  );
  const pulseWidth = useMemo(
    () => period * (dutyCycle / 100),
    [period, dutyCycle],
  );
  const offTime = useMemo(
    () => period * (1 - dutyCycle / 100),
    [period, dutyCycle],
  );
  const avgVoltage = useMemo(
    () => amplitude * (dutyCycle / 100),
    [amplitude, dutyCycle],
  );

  // Period slider is inverse of frequency — edit period by setting frequency
  const setPeriodFromSlider = useCallback((periodSec: number) => {
    const f = 1 / Math.max(periodSec, 1 / FREQ_MAX);
    setFrequency(Math.min(FREQ_MAX, Math.max(FREQ_MIN, f)));
  }, []);

  // Pulse width slider updates duty (period fixed)
  const setPulseWidthFromSlider = useCallback(
    (widthSec: number) => {
      if (period <= 0) return;
      const d = (widthSec / period) * 100;
      setDutyCycle(Math.min(100, Math.max(0, Math.round(d))));
    },
    [period],
  );

  const reset = () => {
    setDutyCycle(DEFAULT_DUTY);
    setFrequency(DEFAULT_FREQ);
    setAmplitude(DEFAULT_AMPLITUDE);
    setPeriodsVisible(3);
    setAnimate(true);
  };

  // Presets for kids
  const presets = [
    { name: "Dim LED", duty: 15, freq: 1000, amp: 5, emoji: "💡" },
    { name: "Half bright", duty: 50, freq: 1000, amp: 5, emoji: "✨" },
    { name: "Full on", duty: 100, freq: 1000, amp: 5, emoji: "🔆" },
    { name: "Slow blink", duty: 50, freq: 2, amp: 5, emoji: "👀" },
    { name: "Fast PWM", duty: 30, freq: 20000, amp: 3.3, emoji: "⚡" },
  ] as const;

  // LED brightness visual (effective brightness ~ duty)
  const ledBrightness = dutyCycle / 100;

  return (
    <div className="flex min-h-full flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-lg shadow-lg shadow-cyan-500/20">
              ∿
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-zinc-50 sm:text-lg">
                PWM Playground
              </h1>
              <p className="hidden text-xs text-zinc-500 sm:block">
                Oscilloscope lab for curious minds
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Kid-friendly intro strip */}
      <div className="border-b border-zinc-800/60 bg-gradient-to-r from-cyan-950/40 via-zinc-950 to-violet-950/40">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <p className="text-sm leading-relaxed text-zinc-300">
            <span className="mr-1.5 font-semibold text-cyan-400">
              What is PWM?
            </span>
            Pulse Width Modulation flips a signal{" "}
            <span className="text-emerald-400">ON</span> and{" "}
            <span className="text-rose-400">OFF</span> really fast. How long
            it stays ON (duty cycle) tricks LEDs into looking dimmer or
            brighter — without changing the real voltage!
          </p>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 lg:flex-row lg:gap-6 sm:p-6">
        {/* LEFT — Controls */}
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[340px] xl:w-[380px]">
          {/* Demo LED */}
          <section className="rounded-2xl border border-zinc-800 bg-card p-4 shadow-xl shadow-black/40">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">
                Live demo — LED
              </h2>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                brightness ≈ duty
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div
                className="led-glow relative flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  background: `radial-gradient(circle, rgba(251,191,36,${0.15 + ledBrightness * 0.85}) 0%, rgba(24,24,27,0.9) 70%)`,
                  boxShadow: `0 0 ${8 + ledBrightness * 40}px rgba(251, 191, 36, ${ledBrightness * 0.85})`,
                }}
              >
                <span
                  className="text-3xl transition-opacity"
                  style={{ opacity: 0.25 + ledBrightness * 0.75 }}
                  aria-hidden
                >
                  💡
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-mono text-2xl font-bold tabular-nums text-amber-300">
                  {Math.round(dutyCycle)}%
                </p>
                <p className="text-xs text-zinc-400">
                  Average voltage{" "}
                  <span className="font-mono text-amber-200">
                    {avgVoltage.toFixed(2)} V
                  </span>
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-150"
                    style={{ width: `${dutyCycle}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* PWM Controls card */}
          <section className="rounded-2xl border border-zinc-800 bg-card p-4 shadow-xl shadow-black/40">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/15 text-xs text-cyan-400">
                1
              </span>
              <h2 className="text-sm font-semibold text-zinc-100">
                PWM Controls
              </h2>
            </div>

            <div className="space-y-5">
              <ControlSlider
                label="Duty cycle"
                value={dutyCycle}
                min={0}
                max={100}
                step={1}
                unit="%"
                color="#22d3ee"
                hint="how long ON"
                onChange={setDutyCycle}
              />

              <ControlSlider
                label="Frequency"
                value={frequency}
                min={FREQ_MIN}
                max={FREQ_MAX}
                step={1}
                unit=" Hz"
                displayValue={formatFreq(frequency)}
                color="#3b82f6"
                hint="how fast"
                logarithmic
                onChange={(v) =>
                  setFrequency(Math.min(FREQ_MAX, Math.max(FREQ_MIN, v)))
                }
              />

              <ControlSlider
                label="Period (T)"
                value={period}
                min={1 / FREQ_MAX}
                max={1 / FREQ_MIN}
                step={1e-6}
                unit=""
                displayValue={formatPeriod(period)}
                color="#a78bfa"
                hint="1 ÷ frequency"
                logarithmic
                onChange={setPeriodFromSlider}
              />

              <ControlSlider
                label="Pulse width (ON time)"
                value={pulseWidth}
                min={0}
                max={Math.max(period, 1e-9)}
                step={period / 100 || 1e-9}
                unit=""
                displayValue={formatTimeShort(pulseWidth)}
                color="#34d399"
                hint="duty × period"
                onChange={setPulseWidthFromSlider}
              />

              <ControlSlider
                label="Amplitude (voltage)"
                value={amplitude}
                min={0}
                max={24}
                step={0.1}
                unit=" V"
                displayValue={amplitude.toFixed(1)}
                color="#fbbf24"
                hint="peak height"
                onChange={setAmplitude}
              />
            </div>
          </section>

          {/* Scope display options */}
          <section className="rounded-2xl border border-zinc-800 bg-card p-4 shadow-xl shadow-black/40">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/15 text-xs text-violet-400">
                2
              </span>
              <h2 className="text-sm font-semibold text-zinc-100">
                Scope display
              </h2>
            </div>
            <div className="space-y-4">
              <ControlSlider
                label="Cycles on screen"
                value={periodsVisible}
                min={1}
                max={8}
                step={1}
                unit=""
                color="#a78bfa"
                onChange={setPeriodsVisible}
              />
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
                <span className="text-sm text-zinc-300">Animate sweep</span>
                <input
                  type="checkbox"
                  checked={animate}
                  onChange={(e) => setAnimate(e.target.checked)}
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>
            </div>
          </section>

          {/* Presets */}
          <section className="rounded-2xl border border-zinc-800 bg-card p-4 shadow-xl shadow-black/40">
            <h2 className="mb-3 text-sm font-semibold text-zinc-100">
              Try these
            </h2>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setDutyCycle(p.duty);
                    setFrequency(p.freq);
                    setAmplitude(p.amp);
                  }}
                  className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-cyan-500/50 hover:bg-cyan-950/40 hover:text-cyan-200"
                >
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
          </section>
        </aside>

        {/* RIGHT — Visualization */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <section className="scope-frame flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-2xl border border-cyan-900/40 bg-[#0c0c0f] shadow-xl shadow-cyan-950/30 sm:min-h-[420px]">
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow shadow-emerald-400/50" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Oscilloscope
                </h2>
              </div>
              <div className="flex gap-3 font-mono text-[10px] text-zinc-500 sm:text-xs">
                <span className="text-cyan-500/90">
                  D = {dutyCycle.toFixed(0)}%
                </span>
                <span className="text-blue-400/90">
                  f = {formatFreq(frequency)}
                </span>
                <span className="hidden text-amber-400/90 sm:inline">
                  Vₚ = {amplitude.toFixed(1)} V
                </span>
              </div>
            </div>
            <div className="relative min-h-[280px] flex-1 p-2 sm:min-h-[360px]">
              <Oscilloscope
                dutyCycle={dutyCycle}
                frequency={frequency}
                amplitude={amplitude}
                periodsVisible={periodsVisible}
                animate={animate}
              />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-800/80 px-4 py-2 text-[11px] text-zinc-500">
              <span>
                <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500/40" />{" "}
                ON region
              </span>
              <span>
                <span className="inline-block h-2 w-2 rounded-sm bg-rose-500/30" />{" "}
                OFF region
              </span>
              <span>
                <span className="inline-block h-0.5 w-3 align-middle bg-amber-400" />{" "}
                average voltage
              </span>
            </div>
          </section>

          {/* Formula / readout panel */}
          <section className="rounded-2xl border border-zinc-800 bg-card p-4 shadow-xl shadow-black/40">
            <h2 className="mb-3 text-sm font-semibold text-zinc-100">
              Live formulas
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FormulaCard
                title="Period"
                formula="T = 1 / f"
                value={formatPeriod(period)}
                color="text-violet-300"
              />
              <FormulaCard
                title="Duty cycle"
                formula="D = t_ON / T"
                value={`${dutyCycle.toFixed(0)}%`}
                color="text-cyan-300"
              />
              <FormulaCard
                title="ON / OFF time"
                formula="t_ON = D × T"
                value={`${formatTimeShort(pulseWidth)} / ${formatTimeShort(offTime)}`}
                color="text-emerald-300"
              />
              <FormulaCard
                title="Average voltage"
                formula="V_avg = D × V_peak"
                value={`${avgVoltage.toFixed(2)} V`}
                color="text-amber-300"
              />
            </div>

            <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3">
              <p className="text-xs leading-relaxed text-zinc-400">
                <span className="font-semibold text-zinc-300">Kid tip: </span>
                Duty cycle is like a light switch you flip super fast. At{" "}
                <span className="font-mono text-cyan-400">50%</span> it&apos;s
                half-on, half-off — your eyes average it to a medium glow. At{" "}
                <span className="font-mono text-cyan-400">10%</span> it looks
                dim. Same peak voltage every time — only the{" "}
                <em className="text-zinc-300">width</em> of the pulse changes!
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-800/60 py-3 text-center text-[11px] text-zinc-600">
        PWM Playground · 100% client-side · learn by turning knobs
      </footer>
    </div>
  );
}

function FormulaCard({
  title,
  formula,
  value,
  color,
}: {
  title: string;
  formula: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      <p className={`mt-1 font-mono text-lg font-semibold tabular-nums ${color}`}>
        {value}
      </p>
      <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{formula}</p>
    </div>
  );
}
