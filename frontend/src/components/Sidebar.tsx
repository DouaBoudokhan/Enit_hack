import { NavLink, useLocation } from "react-router-dom";
import { Search, Link2, Target, Clock, MessageSquare, FileText } from "lucide-react";
import { recentSearches } from "@/data/demo";

import { motion } from "framer-motion";

const navItems = [
  { to: "/", label: "Audits", icon: FileText, end: true },
  { to: "/analyzed-posts", label: "Analyzed Posts", icon: MessageSquare },
  { to: "/analyze-post", label: "Analyze via URL", icon: Link2 },
  { to: "/product-match", label: "Product Match", icon: Target },
];

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside
      className="w-[240px] shrink-0 backdrop-blur-xl border-r border-line h-screen sticky top-0 flex flex-col z-40"
      style={{ background: "var(--sidebar-bg)" }}
    >
      {/* Brand */}
      <div className="px-6 pt-10 pb-8">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center justify-center cursor-pointer"
        >
          <div className="relative">
            <img src="/logo.png" alt="Logo" className="w-32 h-32 object-contain rounded-xl logo-glow relative z-10" />
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full -z-10" />
          </div>
        </motion.div>
      </div>

      {/* Nav */}
      <nav className="px-3 flex flex-col gap-1.5 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.end ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={`relative flex items-center gap-4 h-12 px-5 rounded-xl text-[16px] font-bold transition-all duration-300 z-10 ${
                active
                  ? "text-ink"
                  : "text-ink-secondary hover:text-ink hover:bg-surface-input/50"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active-bg"
                  className="absolute inset-0 bg-surface-input rounded-xl z-[-1] border border-line shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {active && (
                <motion.span 
                  layoutId="sidebar-active-indicator"
                  className="absolute left-1 top-2.5 bottom-2.5 w-[3px] rounded-full bg-primary shadow-[0_0_12px_hsl(var(--accent-purple))]" 
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? "text-primary" : ""} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Recent (pinned bottom) */}
      <div className="mt-auto px-6 pb-10">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-4 opacity-50">
          History
        </div>
        <ul className="flex flex-col gap-3">
          {recentSearches.map((name) => (
            <li key={name}>
              <motion.button
                whileHover={{ x: 4 }}
                type="button"
                className="w-full flex items-center gap-3 text-[12px] font-medium text-ink-secondary hover:text-ink transition-colors truncate text-left group"
                title={name}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-ink-muted/30 group-hover:bg-primary transition-colors" />
                <span className="truncate opacity-80 group-hover:opacity-100">{name}</span>
              </motion.button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
