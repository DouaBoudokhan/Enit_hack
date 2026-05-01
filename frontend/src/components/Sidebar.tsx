import { NavLink, useLocation } from "react-router-dom";
import { Search, Link2, Target, Clock, MessageSquare } from "lucide-react";
import { recentSearches } from "@/data/demo";

const navItems = [
  { to: "/", label: "Smart Search", icon: Search, end: true },
  { to: "/analyze-post", label: "Analyze Post", icon: MessageSquare },
  { to: "/paste-url", label: "Paste URL", icon: Link2 },
  { to: "/product-match", label: "Product Match", icon: Target },
];

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-[220px] shrink-0 bg-surface border-r border-line h-screen sticky top-0 flex flex-col">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="w-3.5 h-3.5 rotate-45 bg-primary rounded-[2px]"
          />
          <span className="text-[15px] font-semibold text-ink tracking-tight-2">
            ENIT HACK
          </span>
        </div>
        <div className="mt-1 text-[11px] text-ink-muted pl-[22px]">
          Influencer Intelligence
        </div>
      </div>

      {/* Nav */}
      <nav className="px-2 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.end ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={`relative flex items-center gap-2.5 h-9 px-3 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                active
                  ? "bg-surface-input text-ink"
                  : "text-ink-secondary hover:bg-background"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-primary" />
              )}
              <Icon size={15} strokeWidth={1.75} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Recent (pinned bottom) */}
      <div className="mt-auto px-5 pb-6">
        <div className="text-[10px] uppercase tracking-widest text-ink-muted mb-2">
          Recent
        </div>
        <ul className="flex flex-col gap-1">
          {recentSearches.map((name) => (
            <li key={name}>
              <button
                type="button"
                className="w-full flex items-center gap-2 text-[13px] text-ink-secondary hover:text-ink truncate text-left"
                title={name}
              >
                <Clock size={12} className="shrink-0 text-ink-muted" />
                <span className="truncate">{name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
