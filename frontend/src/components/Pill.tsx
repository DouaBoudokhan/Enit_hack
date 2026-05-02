import { ReactNode } from "react";
import { motion } from "framer-motion";

type Tone = "neutral" | "teal" | "purple" | "blue" | "amber" | "coral";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-input text-ink-secondary",
  teal: "bg-teal-soft text-teal-ink",
  purple: "bg-primary-soft text-primary-ink",
  blue: "bg-blue-soft text-blue-ink",
  amber: "bg-[hsl(41_90%_92%)] text-[hsl(41_85%_28%)]",
  coral: "bg-[hsl(11_85%_94%)] text-[hsl(11_70%_38%)]",
};

export function Pill({
  children,
  tone = "neutral",
  size = "md",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  size?: "sm" | "md";
  className?: string;
}) {
  const sizing =
    size === "sm" ? "text-[11px] px-2.5 py-[3px]" : "text-[12px] px-3 py-[5px]";
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`inline-flex items-center rounded-full font-medium ${toneClasses[tone]} ${sizing} ${className}`}
    >
      {children}
    </motion.span>
  );
}
