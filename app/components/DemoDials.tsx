"use client";

import type { CSSProperties } from "react";

type DemoDialsProps = {
  duty: number;
  playing: boolean;
};

export function DemoDials({ duty, playing }: DemoDialsProps) {
  const d = duty / 100;
  // Speedometer: -90° (left) at 0% → 0° (up) at 50% → +90° (right) at 100%
  const servoAngle = -90 + d * 180;
  const spinning = playing && d > 0.05;
  const spinDuration = Math.max(0.12, 2.2 - d * 2.05);

  return (
    <section className="rounded-2xl border border-border/80 bg-card p-3 shadow-[var(--panel-shadow)] sm:p-5">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* LED */}
        <div className="flex min-w-0 flex-col items-center gap-2 sm:gap-3">
          <div
            className="relative flex aspect-square w-full max-w-[7rem] items-center justify-center overflow-hidden rounded-full border-4 border-border bg-muted"
            style={{
              boxShadow: `0 0 ${40 * d + 4}px ${10 * d}px color-mix(in oklab, var(--signal) ${Math.round(75 * d)}%, transparent)`,
            }}
          >
            <div
              className="h-[55%] w-[55%] rounded-full bg-signal transition-opacity duration-100"
              style={{ opacity: 0.08 + 0.92 * d }}
            />
          </div>
          <p className="w-full truncate text-center text-[0.65rem] font-bold text-muted-foreground sm:text-[0.8rem]">
            LED · {duty}% bright
          </p>
        </div>

        {/* Motor — blades + hub share true geometric center */}
        <div className="flex min-w-0 flex-col items-center gap-2 sm:gap-3">
          <div className="relative aspect-square w-full max-w-[7rem] overflow-hidden rounded-full border-4 border-border bg-muted">
            {/* Spinning assembly: absolutely centered, origin at center */}
            <div
              className={`absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 ${
                spinning ? "motor-spin" : ""
              }`}
              style={
                {
                  transformOrigin: "center center",
                  ...(spinning
                    ? { "--spin-duration": `${spinDuration}s` }
                    : {}),
                } as CSSProperties
              }
            >
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <span
                  key={deg}
                  className="absolute left-1/2 top-1/2 block rounded-full bg-accent"
                  style={{
                    width: "14%",
                    height: "46%",
                    // Bottom-center of blade sits on rotor center; then fan out
                    transform: `translate(-50%, -100%) rotate(${deg}deg)`,
                    transformOrigin: "50% 100%",
                  }}
                />
              ))}
            </div>
            {/* Hub fixed at dial center (does not need to spin separately) */}
            <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow-sm" />
          </div>
          <p className="w-full truncate text-center text-[0.65rem] font-bold text-muted-foreground sm:text-[0.8rem]">
            Motor · {duty}% speed
          </p>
        </div>

        {/* Servo — speedometer needle, pivots at dial center, −90°…+90° */}
        <div className="flex min-w-0 flex-col items-center gap-2 sm:gap-3">
          <div className="relative aspect-square w-full max-w-[7rem] overflow-hidden rounded-full border-4 border-border bg-muted">
            {/* Soft arc ticks (optional gauge feel) */}
            <div
              className="pointer-events-none absolute inset-[12%] rounded-full border border-border/60"
              aria-hidden
            />

            {/* Needle: bottom end fixed at center, points outward */}
            <div
              className="absolute left-1/2 top-1/2 z-[1] will-change-transform"
              style={{
                width: "8%",
                height: "40%",
                transform: `translate(-50%, -100%) rotate(${servoAngle}deg)`,
                transformOrigin: "50% 100%",
                transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <div className="h-full w-full rounded-full bg-signal shadow-[0_0_8px_color-mix(in_oklab,var(--signal)_50%,transparent)]" />
            </div>

            {/* Center pivot */}
            <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[16%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow-sm" />
            <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[7%] w-[7%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal" />
          </div>
          <p className="w-full truncate text-center text-[0.65rem] font-bold text-muted-foreground sm:text-[0.8rem]">
            Servo · {Math.round(servoAngle)}°
          </p>
        </div>
      </div>
    </section>
  );
}
