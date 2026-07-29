"use client";

import type { CSSProperties, ReactNode } from "react";

/** Scope full-scale for LED/motor drive (matches oscilloscope). */
const AMP_SCALE_MAX = 13;

type DemoDialsProps = {
  duty: number;
  /** Peak PWM voltage (volts) — selected rail. */
  amplitude: number;
  playing: boolean;
};

export function DemoDials({ duty, amplitude, playing }: DemoDialsProps) {
  const dutyFrac = duty / 100;
  const avgV = amplitude * dutyFrac;
  // Brightness / motor speed from average voltage vs full scope scale
  const drive = Math.min(1, Math.max(0, avgV / AMP_SCALE_MAX));
  const servoAngle = -90 + dutyFrac * 180;
  const spinning = playing && drive > 0.03;
  const spinDuration = Math.max(0.12, 2.2 - drive * 2.05);
  const brightPct = Math.round(drive * 100);
  const speedPct = Math.round(drive * 100);

  return (
    <section className="flex h-full min-h-0 w-full flex-col rounded-2xl border border-border/80 bg-card p-3 shadow-[var(--panel-shadow)] sm:p-5">
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-2 sm:gap-4">
        <DemoCell label={`LED · ${brightPct}%`}>
          <div
            className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[3px] border-border bg-muted"
            style={{
              boxShadow: `0 0 ${28 * drive + 2}px ${8 * drive}px color-mix(in oklab, var(--signal) ${Math.round(75 * drive)}%, transparent)`,
            }}
          >
            <div
              className="h-[55%] w-[55%] rounded-full bg-signal transition-opacity duration-100"
              style={{ opacity: 0.08 + 0.92 * drive }}
            />
          </div>
        </DemoCell>

        <DemoCell label={`Motor · ${speedPct}%`}>
          <div className="relative h-full w-full overflow-hidden rounded-full border-[3px] border-border bg-muted">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`relative h-[72%] w-[72%] ${spinning ? "motor-spin" : ""}`}
                style={
                  spinning
                    ? ({ "--spin-duration": `${spinDuration}s` } as CSSProperties)
                    : undefined
                }
              >
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <span
                    key={deg}
                    className="absolute left-1/2 top-1/2 block rounded-full bg-accent"
                    style={{
                      width: "14%",
                      height: "46%",
                      transform: `translate(-50%, -100%) rotate(${deg}deg)`,
                      transformOrigin: "50% 100%",
                    }}
                  />
                ))}
              </div>
            </div>
            <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow-sm" />
          </div>
        </DemoCell>

        <DemoCell label={`Servo · ${Math.round(servoAngle)}°`}>
          <div className="relative h-full w-full overflow-hidden rounded-full border-[3px] border-border bg-muted">
            <div
              className="pointer-events-none absolute inset-[12%] rounded-full border border-border/60"
              aria-hidden
            />
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
            <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[16%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow-sm" />
            <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[7%] w-[7%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal" />
          </div>
        </DemoCell>
      </div>
    </section>
  );
}

function DemoCell({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col items-center justify-center gap-2">
      <div
        className="flex min-h-0 w-full flex-1 items-center justify-center"
        style={{ containerType: "size" }}
      >
        <div
          className="relative shrink-0 overflow-hidden rounded-full"
          style={{
            width: "min(100cqw, 100cqh, 9rem)",
            height: "min(100cqw, 100cqh, 9rem)",
          }}
        >
          {children}
        </div>
      </div>
      <p className="shrink-0 truncate text-center text-[0.65rem] font-bold text-muted-foreground sm:text-[0.75rem]">
        {label}
      </p>
    </div>
  );
}
