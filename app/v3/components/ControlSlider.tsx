"use client";

import type { CSSProperties } from "react";

type ControlSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  displayValue?: string;
  hint?: string;
  color?: string;
  onChange: (value: number) => void;
  /** Use log mapping between min/max (for frequency). */
  logarithmic?: boolean;
};

function toSliderPos(value: number, min: number, max: number, log: boolean) {
  if (!log) return value;
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  return ((Math.log10(value) - logMin) / (logMax - logMin)) * 100;
}

function fromSliderPos(pos: number, min: number, max: number, log: boolean) {
  if (!log) return pos;
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const t = pos / 100;
  return Math.pow(10, logMin + t * (logMax - logMin));
}

export function ControlSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  displayValue,
  hint,
  color = "#22d3ee",
  onChange,
  logarithmic = false,
}: ControlSliderProps) {
  const sliderMin = logarithmic ? 0 : min;
  const sliderMax = logarithmic ? 100 : max;
  const sliderStep = logarithmic ? 0.1 : step;
  const sliderValue = logarithmic
    ? toSliderPos(value, min, max, true)
    : value;

  const pct = logarithmic
    ? sliderValue
    : ((value - min) / (max - min)) * 100;

  const shown =
    displayValue ??
    (Number.isInteger(step) && step >= 1
      ? String(Math.round(value))
      : value.toFixed(step < 0.1 ? 2 : 1));

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-zinc-200">{label}</label>
        <span
          className="font-mono text-sm font-semibold tabular-nums"
          style={{ color }}
        >
          {shown}
          {unit ? (
            <span className="ml-0.5 text-xs font-normal text-zinc-400">
              {unit}
            </span>
          ) : null}
        </span>
      </div>

      <input
        type="range"
        className="pwm-slider"
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={sliderValue}
        aria-label={label}
        onChange={(e) => {
          const raw = Number(e.target.value);
          if (logarithmic) {
            const next = fromSliderPos(raw, min, max, true);
            // Snap to nice step in linear domain when possible
            const snapped =
              step >= 1 ? Math.round(next / step) * step : next;
            onChange(Math.min(max, Math.max(min, snapped)));
          } else {
            onChange(raw);
          }
        }}
        style={
          {
            "--slider-fill": color,
            "--slider-pct": `${pct}%`,
          } as CSSProperties
        }
      />

      <div className="flex justify-between text-[10px] uppercase tracking-wide text-zinc-500">
        <span>
          {logarithmic
            ? formatBound(min, unit)
            : `${min}${unit}`}
        </span>
        {hint ? <span className="normal-case tracking-normal">{hint}</span> : null}
        <span>
          {logarithmic
            ? formatBound(max, unit)
            : `${max}${unit}`}
        </span>
      </div>
    </div>
  );
}

function formatBound(n: number, unit: string) {
  if (n >= 1000) return `${n / 1000}k${unit}`;
  return `${n}${unit}`;
}
