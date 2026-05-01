import { useCountUp } from "@/hooks/useCountUp";

export function CountNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
  duration = 800,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const v = useCountUp(value, duration, decimals);
  const formatted = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString();
  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
