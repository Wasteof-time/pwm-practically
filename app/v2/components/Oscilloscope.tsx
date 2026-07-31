"use client";

import { useEffect, useRef } from "react";

export type OscilloscopeProps = {
  /** Duty cycle 0–100 */
  dutyCycle: number;
  /** Frequency in Hz (used for labels; waveform is multi-period) */
  frequency: number;
  /** Peak amplitude (volts) */
  amplitude: number;
  /** How many periods to draw across the screen */
  periodsVisible?: number;
  /** Animate a horizontal sweep (kid-friendly) */
  animate?: boolean;
};

export function Oscilloscope({
  dutyCycle,
  frequency,
  amplitude,
  periodsVisible = 3,
  animate = true,
}: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const draw = (t: number) => {
      if (!running) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // Slow visual scroll — not true frequency (scope shows frozen cycles)
      if (animate) {
        phaseRef.current = (t * 0.00012) % 1;
      }

      // Background
      ctx.fillStyle = "#0c0c0f";
      ctx.fillRect(0, 0, w, h);

      const padL = 52;
      const padR = 16;
      const padT = 28;
      const padB = 36;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;

      // Grid
      ctx.strokeStyle = "rgba(34, 211, 238, 0.08)";
      ctx.lineWidth = 1;
      const vLines = 12;
      const hLines = 8;
      for (let i = 0; i <= vLines; i++) {
        const x = padL + (i / vLines) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + plotH);
        ctx.stroke();
      }
      for (let i = 0; i <= hLines; i++) {
        const y = padT + (i / hLines) * plotH;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + plotW, y);
        ctx.stroke();
      }

      // Center zero line
      const zeroY = padT + plotH * 0.75;
      ctx.strokeStyle = "rgba(161, 161, 170, 0.35)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, zeroY);
      ctx.lineTo(padL + plotW, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Max voltage line
      const maxV = Math.max(amplitude, 0.1);
      const highY = padT + plotH * 0.15;
      const ampScale = (zeroY - highY) / maxV;

      // Average voltage dashed line
      const avgV = (dutyCycle / 100) * amplitude;
      const avgY = zeroY - avgV * ampScale;
      ctx.strokeStyle = "rgba(251, 191, 36, 0.55)";
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, avgY);
      ctx.lineTo(padL + plotW, avgY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${amplitude.toFixed(1)} V`, padL - 8, highY + 4);
      ctx.fillText("0 V", padL - 8, zeroY + 4);
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(`avg ${avgV.toFixed(2)} V`, padL - 8, avgY + 4);

      // Time axis
      ctx.fillStyle = "#71717a";
      ctx.textAlign = "center";
      const periodSec = frequency > 0 ? 1 / frequency : 1;
      const totalTime = periodSec * periodsVisible;
      ctx.fillText("time →", padL + plotW / 2, h - 10);
      ctx.textAlign = "left";
      ctx.fillText("0", padL, h - 10);
      ctx.textAlign = "right";
      ctx.fillText(formatTime(totalTime), padL + plotW, h - 10);

      // PWM waveform
      const duty = Math.min(100, Math.max(0, dutyCycle)) / 100;
      const phase = phaseRef.current;
      const samples = Math.max(400, Math.floor(plotW * 2));

      // Glow underlay
      ctx.strokeStyle = "rgba(34, 211, 238, 0.25)";
      ctx.lineWidth = 6;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      drawWave(ctx, padL, plotW, zeroY, ampScale, amplitude, duty, periodsVisible, phase, samples);

      // Main trace
      const grad = ctx.createLinearGradient(padL, 0, padL + plotW, 0);
      grad.addColorStop(0, "#22d3ee");
      grad.addColorStop(0.5, "#67e8f9");
      grad.addColorStop(1, "#a78bfa");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      drawWave(ctx, padL, plotW, zeroY, ampScale, amplitude, duty, periodsVisible, phase, samples);

      // ON / OFF region tint for first period
      const firstPeriodW = plotW / periodsVisible;
      const onW = firstPeriodW * duty;
      ctx.fillStyle = "rgba(52, 211, 153, 0.08)";
      ctx.fillRect(padL, padT, onW, plotH);
      ctx.fillStyle = "rgba(244, 63, 94, 0.06)";
      ctx.fillRect(padL + onW, padT, firstPeriodW - onW, plotH);

      // Period / pulse width brackets on first cycle
      const bracketY = padT + 8;
      drawBracket(ctx, padL, padL + firstPeriodW, bracketY, "#a78bfa", "Period (T)");
      if (onW > 24) {
        drawBracket(ctx, padL, padL + onW, bracketY + 16, "#34d399", "ON width");
      }

      // Scope chrome label
      ctx.fillStyle = "rgba(34, 211, 238, 0.7)";
      ctx.font = "bold 10px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText("CH1  ·  PWM", padL, 16);
      ctx.textAlign = "right";
      ctx.fillStyle = "#52525b";
      ctx.fillText(`${periodsVisible} cycles`, padL + plotW, 16);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [dutyCycle, frequency, amplitude, periodsVisible, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full rounded-lg"
      role="img"
      aria-label={`PWM oscilloscope: ${dutyCycle}% duty, ${frequency} hertz, ${amplitude} volts`}
    />
  );
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  padL: number,
  plotW: number,
  zeroY: number,
  ampScale: number,
  amplitude: number,
  duty: number,
  periods: number,
  phase: number,
  samples: number,
) {
  ctx.beginPath();
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    // fractional position across periods, with scroll phase
    const cyclePos = (t * periods + phase * periods) % 1;
    const high = cyclePos < duty;
    const v = high ? amplitude : 0;
    const x = padL + t * plotW;
    const y = zeroY - v * ampScale;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawBracket(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  color: string,
  label: string,
) {
  const h = 6;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y + h);
  ctx.lineTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.lineTo(x2, y + h);
  ctx.stroke();
  ctx.font = "9px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, (x1 + x2) / 2, y - 3);
}

function formatTime(seconds: number): string {
  if (seconds >= 1) return `${seconds.toFixed(2)} s`;
  if (seconds >= 1e-3) return `${(seconds * 1e3).toFixed(2)} ms`;
  if (seconds >= 1e-6) return `${(seconds * 1e6).toFixed(1)} µs`;
  return `${(seconds * 1e9).toFixed(0)} ns`;
}
