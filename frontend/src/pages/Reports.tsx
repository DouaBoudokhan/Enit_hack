import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { AnimatedBar, StackedBar } from "@/components/Bars";
import { CountNumber } from "@/components/CountNumber";
import { Users, ExternalLink } from "lucide-react";

interface FormatData {
  likes: number;
  comments: number;
  quality: string;
  count: number;
}

interface ParsedMetrics {
  sentiment?: { positive: number; negative: number; neutral: number };
  avg_quality?: number;
  posts_analyzed?: number;
  per_post?: { post: number; positive: number; negative: number; neutral: number; quality: number }[];
  toxicity_rate?: number;
  audience_health?: string;
  languages?: { name: string; pct: number; opacity: number }[];
  primary_niche?: string;
  secondary_niches?: string[];
  followers?: number;
  full_name?: string;
  bio?: string;
  comments_analyzed?: number;
  total_likes?: number;
  total_posts?: number;
  engagement_rate?: number;
  nps?: number;
  cqs?: number;
  formats?: { casual?: FormatData; reel?: FormatData };
}

interface Report {
  id: string;
  name: string;
  content: string;
  parsed: ParsedMetrics;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const tones = {
  teal: "text-teal",
  blue: "text-blue",
  ink: "text-ink",
  amber: "text-amber",
  coral: "text-coral",
} as const;

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M followers`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K followers`;
  return `${n} followers`;
}

/** Strip accents, dots, underscores → lowercase for fuzzy matching */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // strip accents (ï→i, é→e)
    .replace(/[._]/g, " ")             // dots/underscores → spaces
    .replace(/\|.*/g, "")              // drop everything after | (Arabic name)
    .toLowerCase()
    .trim();
}

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setActiveReport(null);
      return;
    }
    
    const term = normalize(searchTerm);
    const match = reports.find(r => {
      const normName = normalize(r.name);
      const normId = normalize(r.id);
      return normName === term || normId === term ||
             normName.includes(term) || normId.includes(term) ||
             term.includes(normName) || term.includes(normId);
    });
    
    if (match) {
      setActiveReport(match);
    } else {
      setActiveReport(null);
      alert("Influenceur introuvable dans la base locale");
    }
  };

  useEffect(() => {
    fetch("http://localhost:8000/api/reports")
      .then((res) => res.json())
      .then((data) => {
        setReports(data.reports);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch reports", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -inset-4 bg-primary/20 blur-xl rounded-full"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full shadow-2xl"
          />
        </div>
      </div>
    );
  }

  const p = activeReport?.parsed;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink tracking-tight-2">
          Audits d'Engagement
        </h1>
        <p className="text-[14px] text-ink-secondary mt-1">
          Intelligence augmentée pour décoder les dynamiques sociales et l'influence réelle.
        </p>
      </div>

      <form onSubmit={handleSearch}>
        <div className="relative bg-surface border border-line-strong/80 rounded-[10px] h-12 flex items-center px-4 transition-shadow focus-within:border-primary focus-within:shadow-[0_0_0_3px_hsl(var(--accent-purple)/0.1)]">
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!e.target.value.trim()) setActiveReport(null);
            }}
            placeholder="Search by name, e.g. Oumaima Hamrouni"
            className="flex-1 bg-transparent outline-none text-[14px] text-ink placeholder:text-ink-muted"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-primary-strong text-primary-foreground text-[14px] font-medium h-8 px-4 rounded-lg transition-colors duration-150 active:scale-[0.98]"
          >
            Analyze →
          </button>
        </div>
      </form>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {activeReport && p && (
            <motion.div
              key={activeReport.id}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col gap-4 animate-fade-in"
            >
              {/* HERO CARD */}
              <Card>
                <div className="flex items-stretch gap-8">
                  {/* Left: identity */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className="w-[72px] h-[72px] rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "hsl(36 35% 86%)" }}
                    >
                      <span className="text-[22px] font-semibold text-primary-ink">
                        {activeReport.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[20px] font-semibold text-ink tracking-tight-2">
                        {activeReport.name}
                      </div>
                      <div className="text-[13px] text-ink-muted">@{activeReport.id}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <Pill tone="neutral" size="sm">{p.primary_niche || "Lifestyle"}</Pill>
                        {p.secondary_niches?.map((n) => (
                          <Pill key={n} tone="neutral" size="sm">{n}</Pill>
                        ))}
                        <Pill tone="teal" size="sm">Tunisia</Pill>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] text-ink-secondary mt-2.5">
                        <Users size={13} className="text-ink-muted" />
                        {p.followers ? formatFollowers(p.followers) : "N/A"}
                      </div>
                      {/* Social links */}
                      <div className="flex items-center gap-3 mt-2">
                        <a href={`https://www.instagram.com/${activeReport.id}/`} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1 text-[12px] text-primary hover:text-primary-strong transition-colors">
                          <ExternalLink size={11} /> Instagram
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Right: 3 metrics */}
                  <div className="flex items-center divide-x divide-line">
                    <div className="px-7 first:pl-0 last:pr-0 flex flex-col items-start gap-1.5 min-w-[140px]">
                      <div className="leading-none">
                        <CountNumber value={p.cqs || 0} decimals={1} className="text-[32px] metric-num text-teal" />
                      </div>
                      <div className="text-[11px] text-ink-muted">CQS score</div>
                      <Pill tone="teal" size="sm">{p.audience_health || "N/A"}</Pill>
                    </div>
                    <div className="px-7 first:pl-0 last:pr-0 flex flex-col items-start gap-1.5 min-w-[140px]">
                      <div className="leading-none">
                        <CountNumber value={p.nps || 0} prefix="+" className="text-[32px] metric-num text-teal" />
                      </div>
                      <div className="text-[11px] text-ink-muted">Audience NPS</div>
                      <Pill tone="teal" size="sm">{(p.nps || 0) >= 50 ? "Loyal" : "Moderate"}</Pill>
                    </div>
                    <div className="px-7 first:pl-0 last:pr-0 flex flex-col items-start gap-1.5 min-w-[140px]">
                      <div className="leading-none">
                        <CountNumber value={p.engagement_rate || 0} decimals={1} suffix="%" className="text-[32px] metric-num text-blue" />
                      </div>
                      <div className="text-[11px] text-ink-muted">Engagement rate</div>
                      <Pill tone="blue" size="sm">{(p.engagement_rate || 0) >= 3 ? "High" : "Moderate"}</Pill>
                    </div>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-background rounded-[10px] p-4">
                    <div className="text-[12px] text-ink-muted">Audience health</div>
                    <div className={`text-[18px] font-semibold mt-1 tracking-tight-2 ${tones.teal}`}>
                      {p.audience_health || "N/A"}
                    </div>
                  </div>
                  <div className="bg-background rounded-[10px] p-4">
                    <div className="text-[12px] text-ink-muted">Toxicity rate</div>
                    <div className={`text-[18px] font-semibold mt-1 tracking-tight-2 ${tones.ink}`}>
                      {p.toxicity_rate != null ? `${p.toxicity_rate}%` : "N/A"}
                    </div>
                  </div>
                  <div className="bg-background rounded-[10px] p-4">
                    <div className="text-[12px] text-ink-muted">Comments analyzed</div>
                    <div className={`text-[18px] font-semibold mt-1 tracking-tight-2 ${tones.ink}`}>
                      {p.comments_analyzed || p.posts_analyzed || "N/A"}
                    </div>
                  </div>
                </div>
              </Card>

              {/* SENTIMENT ANALYSIS */}
              {p.sentiment && (
                <Card noPadding>
                  <CardHeader
                    title="Sentiment analysis"
                    subtitle="Overall community sentiment from comment classification"
                  />
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-background rounded-[10px] p-4 border-t-[3px]" style={{ borderTopColor: "hsl(var(--accent-teal))" }}>
                        <div className="text-[28px] metric-num text-teal">
                          <CountNumber value={p.sentiment.positive} decimals={1} suffix="%" />
                        </div>
                        <div className="text-[12px] text-ink-secondary mt-1">Positive</div>
                        <div className="text-[11px] text-ink-muted">Genuine engagement</div>
                      </div>
                      <div className="bg-background rounded-[10px] p-4 border-t-[3px]" style={{ borderTopColor: "hsl(var(--accent-amber))" }}>
                        <div className="text-[28px] metric-num text-amber">
                          <CountNumber value={p.sentiment.neutral} decimals={1} suffix="%" />
                        </div>
                        <div className="text-[12px] text-ink-secondary mt-1">Neutral</div>
                        <div className="text-[11px] text-ink-muted">Questions & observations</div>
                      </div>
                      <div className="bg-background rounded-[10px] p-4 border-t-[3px]" style={{ borderTopColor: "hsl(var(--accent-coral))" }}>
                        <div className="text-[28px] metric-num text-coral">
                          <CountNumber value={p.sentiment.negative} decimals={1} suffix="%" />
                        </div>
                        <div className="text-[12px] text-ink-secondary mt-1">Negative</div>
                        <div className="text-[11px] text-ink-muted">Criticism & spam</div>
                      </div>
                    </div>
                    <StackedBar
                      segments={[
                        { pct: p.sentiment.positive, color: "hsl(var(--accent-teal))" },
                        { pct: p.sentiment.neutral, color: "hsl(var(--accent-amber))" },
                        { pct: p.sentiment.negative, color: "hsl(var(--accent-coral))" },
                      ]}
                    />
                    <div className="mt-3 text-[12px] text-ink-muted">
                      Community quality:{" "}
                      <span className="font-semibold text-teal">
                        {p.sentiment.positive >= 70 ? "Positive & engaged" : p.sentiment.positive >= 50 ? "Mixed signals" : "Needs attention"}
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* LANGUAGES */}
              {p.languages && p.languages.length > 0 && (
                <Card noPadding>
                  <CardHeader title="Audience languages" />
                  <div className="p-5 flex flex-col gap-3">
                    {p.languages.map((l, i) => (
                      <div key={l.name} className="flex items-center gap-4">
                        <div className="w-20 shrink-0 text-[13px] text-ink-secondary">
                          {l.name}
                        </div>
                        <div className="flex-1">
                          <AnimatedBar
                            pct={l.pct}
                            color="hsl(var(--accent-purple))"
                            opacity={l.opacity}
                            delay={i * 80}
                          />
                        </div>
                        <div className="w-12 text-right text-[13px] text-ink-secondary tabular-nums">
                          {l.pct}%
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* CONTENT DOMAIN */}
              <Card noPadding>
                <CardHeader title="Content domain" />
                <div className="p-5 grid grid-cols-2 gap-8">
                  <div>
                    <Pill tone="purple" className="!text-[14px] !px-5 !py-2.5">
                      {p.primary_niche || "Lifestyle"}
                    </Pill>
                    <div className="text-[11px] text-ink-muted mt-2">Primary niche</div>
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-1.5">
                      {(p.secondary_niches || []).map((n) => (
                        <Pill key={n} size="sm">{n}</Pill>
                      ))}
                    </div>
                    <div className="text-[11px] text-ink-muted mt-2">Secondary niches</div>
                  </div>
                </div>
              </Card>

              {/* POST FORMAT PERFORMANCE */}
              {p.formats && (p.formats.casual || p.formats.reel) && (
                <Card noPadding>
                  <CardHeader
                    title="Post format performance"
                    subtitle={`Casual posts vs Reels — avg across ${p.posts_analyzed || 10} posts`}
                  />
                  <div className="p-5 grid grid-cols-2 gap-3">
                    {p.formats.casual && (
                      <div className="bg-background rounded-[10px] p-4 relative">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] uppercase tracking-widest rounded-md px-2 py-[3px] font-medium bg-surface-input text-ink-secondary">IMAGE</span>
                        </div>
                        <div className="text-[13px] font-medium text-ink mb-3">Casual posts (image)</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <div><div className="text-[11px] text-ink-muted">Avg likes</div><div className="text-[16px] font-semibold text-ink mt-0.5 tracking-tight-2">{p.formats.casual.likes.toLocaleString()}</div></div>
                          <div><div className="text-[11px] text-ink-muted">Avg comments</div><div className="text-[16px] font-semibold text-ink mt-0.5 tracking-tight-2">{p.formats.casual.comments}</div></div>
                          <div><div className="text-[11px] text-ink-muted">Avg quality</div><div className="text-[16px] font-semibold text-ink mt-0.5 tracking-tight-2">{p.formats.casual.quality}</div></div>
                          <div><div className="text-[11px] text-ink-muted">Posts count</div><div className="text-[16px] font-semibold text-ink mt-0.5 tracking-tight-2">{p.formats.casual.count}</div></div>
                        </div>
                      </div>
                    )}
                    {p.formats.reel && (
                      <div className="bg-background rounded-[10px] p-4 relative">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] uppercase tracking-widest rounded-md px-2 py-[3px] font-medium bg-primary-soft text-primary-ink">REEL</span>
                          <Pill tone="teal" size="sm">Best format</Pill>
                        </div>
                        <div className="text-[13px] font-medium text-ink mb-3">Reels</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <div><div className="text-[11px] text-ink-muted">Avg likes</div><div className="text-[16px] font-semibold text-ink mt-0.5 tracking-tight-2">{p.formats.reel.likes.toLocaleString()}</div></div>
                          <div><div className="text-[11px] text-ink-muted">Avg comments</div><div className="text-[16px] font-semibold text-ink mt-0.5 tracking-tight-2">{p.formats.reel.comments}</div></div>
                          <div><div className="text-[11px] text-ink-muted">Avg quality</div><div className="text-[16px] font-semibold text-ink mt-0.5 tracking-tight-2">{p.formats.reel.quality}</div></div>
                          <div><div className="text-[11px] text-ink-muted">Posts count</div><div className="text-[16px] font-semibold text-ink mt-0.5 tracking-tight-2">{p.formats.reel.count}</div></div>
                        </div>
                      </div>
                    )}
                  </div>
                  {p.formats.casual && p.formats.reel && (
                    <div className="px-5 pb-5">
                      <div className="flex items-start gap-2 text-[13px] text-ink-secondary">
                        <span>↑</span>
                        <span>
                          Reels generate <span className="font-semibold text-ink">{Math.round(((p.formats.reel.likes - p.formats.casual.likes) / (p.formats.casual.likes || 1)) * 100)}%</span>{" "}
                          more likes and <span className="font-semibold text-ink">{Math.round(((p.formats.reel.comments - p.formats.casual.comments) / (p.formats.casual.comments || 1)) * 100)}%</span>{" "}
                          more comments than casual posts for this creator.
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Reports;
