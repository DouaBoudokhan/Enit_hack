import { ReactNode } from "react";
import { motion } from "framer-motion";

export function Card({
  children,
  className = "",
  noPadding = false,
  hoverable = false,
}: {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  hoverable?: boolean;
}) {
  return (
    <motion.div
      whileHover={
        hoverable
          ? { 
              y: -4,
              boxShadow: "0 12px 40px -8px rgba(0,0,0,0.08), 0 0 0 1px hsl(var(--primary) / 0.15) inset" 
            }
          : {}
      }
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`bg-surface/80 backdrop-blur-md rounded-[12px] shadow-card border border-transparent transition-colors duration-200 ${
        hoverable ? "cursor-pointer hover:border-primary/20" : ""
      } ${noPadding ? "" : "p-5"} ${className}`}
    >
      {children}
    </motion.div>
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
