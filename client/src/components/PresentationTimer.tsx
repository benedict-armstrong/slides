import { useState, useEffect } from "react";

interface PresentationTimerProps {
  mode: string | null;
  duration: number | null;
  threshold: number | null;
  startedAt: number;
  className?: string;
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function PresentationTimer({ mode, duration, threshold, startedAt, className = "" }: PresentationTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!mode) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, startedAt]);

  if (!mode) return null;

  const display = mode === "down" && duration ? Math.max(0, duration - elapsed) : elapsed;
  const isWarning = threshold != null && threshold > 0 && (
    mode === "down"
      ? display <= threshold
      : elapsed >= (duration != null ? duration - threshold : threshold)
  );

  const warningProgress = isWarning && threshold > 0
    ? Math.min(1, mode === "down"
        ? 1 - display / threshold
        : (elapsed - ((duration ?? 0) - threshold)) / threshold)
    : 0;

  return (
    <span
      className={`font-mono tabular-nums transition-colors duration-500 ${className}`}
      style={isWarning ? { color: `hsl(${(1 - warningProgress) * 30}, 90%, 50%)` } : undefined}
    >
      {formatTime(display)}
    </span>
  );
}
