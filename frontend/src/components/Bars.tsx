import { motion } from "framer-motion";

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
  return (
    <div
      className="w-full bg-surface-input rounded-full overflow-hidden"
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        initial={{ width: "0%" }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: delay / 1000 }}
        style={{ background: color, opacity }}
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
  return (
    <div
      className="w-full rounded-full overflow-hidden flex bg-surface-input"
      style={{ height }}
    >
      {segments.map((s, i) => (
        <motion.div
          key={i}
          className="h-full"
          initial={{ width: "0%" }}
          animate={{ width: `${s.pct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: (i * 80) / 1000 }}
          style={{ background: s.color }}
        />
      ))}
    </div>
  );
}
