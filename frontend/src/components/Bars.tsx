import { useEffect, useState } from "react";

export function AnimatedBar({
  pct,
  color = "hsl(var(--accent-purple))",
  opacity = 1,
  delay = 0,
  height = 8,
}: {
  pct: number;
  color?: string;
  opacity?: number;
  delay?: number;
  height?: number;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 60 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div
      className="w-full bg-surface-input rounded-full overflow-hidden"
      style={{ height }}
    >
      <div
        className="bar-fill h-full rounded-full"
        style={{ width: `${w}%`, background: color, opacity }}
      />
    </div>
  );
}

export function StackedBar({
  segments,
  height = 10,
}: {
  segments: { pct: number; color: string }[];
  height?: number;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="w-full rounded-full overflow-hidden flex bg-surface-input"
      style={{ height }}
    >
      {segments.map((s, i) => (
        <div
          key={i}
          className="bar-fill h-full"
          style={{
            width: animated ? `${s.pct}%` : "0%",
            background: s.color,
            transitionDelay: `${i * 80}ms`,
          }}
        />
      ))}
    </div>
  );
}
