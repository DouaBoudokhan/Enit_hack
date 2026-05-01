import { ReactNode } from "react";

export function Card({
  children,
  className = "",
  noPadding = false,
}: {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div
      className={`bg-surface rounded-[10px] shadow-card hover:border-line-strong transition-colors duration-150 ${
        noPadding ? "" : "p-5"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="px-5 py-4 border-b border-line">
      <div className="text-[14px] font-medium text-ink">{title}</div>
      {subtitle && (
        <div className="text-[12px] text-ink-muted mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}
