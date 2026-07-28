"use client";

import type { CSSProperties } from "react";

type DemoDialsProps = {
  duty: number;
  playing: boolean;
};

export function DemoDials({ duty, playing }: DemoDialsProps) {
  const d = duty / 100;
  const servoAngle = -90 + d * 180;
  const spinning = playing && d > 0.05;
  const spinDuration = Math.max(0.12, 2.2 - d * 2.05);

  return (
    <div className="grid grid-cols-3 gap-2 rounded-[calc(var(--radius)+8px)] border-2 border-border bg-card p-5 shadow-[var(--panel-shadow)]">
      {/* LED */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-border bg-muted"
          style={{
            boxShadow: `0 0 ${40 * d + 4}px ${10 * d}px color-mix(in oklab, var(--signal) ${Math.round(75 * d)}%, transparent)`,
          }}
        >
          <div
            className="h-16 w-16 rounded-full bg-signal transition-opacity duration-100"
            style={{ opacity: 0.08 + 0.92 * d }}
          />
        </div>
        <p className="text-center text-[0.8rem] font-bold text-muted-foreground">
          LED · {duty}% bright
        </p>
      </div>

      {/* Motor */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-border bg-muted">
          <div
            className={`relative h-20 w-20 ${spinning ? "motor-spin" : ""}`}
            style={
              spinning
                ? ({ "--spin-duration": `${spinDuration}s` } as CSSProperties)
                : undefined
            }
          >
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <span
                key={deg}
                className="absolute left-1/2 top-1/2 h-9 w-3 -translate-x-1/2 rounded-full bg-accent"
                style={{
                  transform: `translate(-50%, -100%) rotate(${deg}deg)`,
                  transformOrigin: "bottom center",
                }}
              />
            ))}
            <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" />
          </div>
        </div>
        <p className="text-center text-[0.8rem] font-bold text-muted-foreground">
          Motor · {duty}% speed
        </p>
      </div>

      {/* Servo */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-28 w-28 items-end justify-center overflow-hidden rounded-full border-4 border-border bg-muted">
          <div
            className="mb-4 h-20 w-2.5 rounded-full bg-signal transition-transform duration-200 ease-out"
            style={{
              transform: `rotate(${servoAngle}deg)`,
              transformOrigin: "bottom center",
            }}
          />
          <span className="absolute bottom-3 h-5 w-5 rounded-full bg-foreground" />
        </div>
        <p className="text-center text-[0.8rem] font-bold text-muted-foreground">
          Servo · {Math.round(servoAngle)}°
        </p>
      </div>
    </div>
  );
}
