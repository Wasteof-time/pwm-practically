"use client";

import { useCallback, useEffect, useRef } from "react";

const CYCLES = 4;

/** Classic scope look: black CRT + electric green trace + saffron average */
const SCOPE = {
  bg: "#050507",
  grid: "#1a2e1a",
  label: "#7a9a7a",
  signal: "#00ff41",
  saffron: "#ff9933",
  offLabel: "#5a6a5a",
} as const;

export type WaveCanvasProps = {
  duty: number;
  freq: number;
  playing: boolean;
  showAverage: boolean;
  challengeTarget: number | null;
  onDutyChange: (duty: number) => void;
};

export function WaveCanvas({
  duty,
  freq,
  playing,
  showAverage,
  challengeTarget,
  onDutyChange,
}: WaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);
  const lastRef = useRef(performance.now());
  const draggingRef = useRef(false);
  const propsRef = useRef({
    duty,
    freq,
    playing,
    showAverage,
    challengeTarget,
    onDutyChange,
  });

  propsRef.current = { duty, freq, playing, showAverage, challengeTarget, onDutyChange };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;

    const drawWave = (
      d: number,
      padL: number,
      cycleW: number,
      offset: number,
      hi: number,
      lo: number,
    ) => {
      let started = false;
      for (let i = -1; i <= CYCLES + 1; i++) {
        const x = padL + offset + i * cycleW;
        const onEnd = x + cycleW * d;
        const yStart = d > 0 ? hi : lo;
        if (!started) {
          ctx.moveTo(x, yStart);
          started = true;
        } else {
          ctx.lineTo(x, yStart);
        }
        if (d > 0) ctx.lineTo(onEnd, hi);
        if (d < 1) {
          ctx.lineTo(onEnd, lo);
          ctx.lineTo(x + cycleW, lo);
        }
      }
    };

    const frame = (now: number) => {
      if (!running) return;
      const p = propsRef.current;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      if (p.playing) {
        phaseRef.current = (phaseRef.current + dt * Math.min(p.freq, 2) * 0.25) % 1;
      }

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) {
        raf = requestAnimationFrame(frame);
        return;
      }

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Solid black scope face
      ctx.fillStyle = SCOPE.bg;
      ctx.fillRect(0, 0, w, h);

      const padL = 56;
      const padR = 20;
      const top = 28;
      const bottom = h - 40;
      const plotW = w - padL - padR;
      const hi = top;
      const lo = bottom;

      ctx.strokeStyle = SCOPE.grid;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const x = padL + (plotW * i) / 10;
        ctx.beginPath();
        ctx.moveTo(x, top - 10);
        ctx.lineTo(x, bottom + 10);
        ctx.stroke();
      }
      for (let i = 0; i <= 4; i++) {
        const y = top + ((bottom - top) * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
      }

      ctx.fillStyle = SCOPE.label;
      ctx.font = "600 13px ui-monospace, monospace";
      ctx.textAlign = "right";
      ctx.fillText("5V", padL - 10, hi + 5);
      ctx.fillText("0V", padL - 10, lo + 5);

      const cycleW = plotW / CYCLES;
      const offset = -phaseRef.current * cycleW;
      const d = p.duty / 100;

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, 0, plotW, h);
      ctx.clip();

      if (p.challengeTarget != null) {
        ctx.strokeStyle = SCOPE.saffron;
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        drawWave(p.challengeTarget / 100, padL, cycleW, offset, hi, lo);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Electric green PWM trace
      ctx.strokeStyle = SCOPE.signal;
      ctx.lineWidth = 6;
      ctx.lineJoin = "round";
      ctx.shadowColor = SCOPE.signal;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      drawWave(d, padL, cycleW, offset, hi, lo);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Saffron dotted average line
      if (p.showAverage) {
        const y = lo - (lo - hi) * d;
        ctx.strokeStyle = SCOPE.saffron;
        ctx.setLineDash([10, 8]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = SCOPE.saffron;
        ctx.textAlign = "left";
        ctx.font = "700 13px ui-monospace, monospace";
        ctx.fillText(`average ${(5 * d).toFixed(2)} V`, padL + 8, y - 8);
      }

      const x0 = padL + offset + cycleW;
      ctx.textAlign = "center";
      ctx.font = "700 13px ui-monospace, monospace";
      if (d > 0.12) {
        ctx.fillStyle = SCOPE.signal;
        ctx.fillText("ON", x0 + (cycleW * d) / 2, hi - 10);
      }
      if (d < 0.88) {
        ctx.fillStyle = SCOPE.offLabel;
        ctx.fillText("OFF", x0 + cycleW * d + (cycleW * (1 - d)) / 2, lo + 22);
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  const updateFromPointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const padL = 56;
      const plotW = rect.width - padL - 20;
      const cycleW = plotW / CYCLES;
      const x = e.clientX - rect.left - padL + phaseRef.current * cycleW;
      const within = ((x % cycleW) + cycleW) % cycleW;
      const next = Math.round(Math.min(100, Math.max(0, (within / cycleW) * 100)));
      onDutyChange(next);
    },
    [onDutyChange],
  );

  return (
    <canvas
      ref={canvasRef}
      id="wave"
      aria-label="PWM square wave"
      className="block h-[220px] w-full max-w-full cursor-ew-resize touch-none rounded-xl sm:h-[300px] md:h-[340px] lg:h-[380px]"
      style={{ background: SCOPE.bg }}
      onPointerDown={(e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromPointer(e);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) updateFromPointer(e);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
    />
  );
}
