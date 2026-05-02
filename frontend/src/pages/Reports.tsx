import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { AnimatedBar, StackedBar } from "@/components/Bars";
import { CountNumber } from "@/components/CountNumber";
import { Users, ExternalLink, Search } from "lucide-react";

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
      <div className="flex h-[80vh] items-center justify-center">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -inset-10 bg-primary/30 blur-[60px] rounded-full"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-12 h-12 border-2 border-white/5 border-t-primary rounded-full"
          />
        </div>
      </div>
    );
  }

  const p = activeReport?.parsed;

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">
            Social Intelligence Hub
          </h1>
          <p className="text-[15px] text-text-secondary max-w-lg leading-relaxed">
            Analyze Tunisian influencers with real-time OSINT data, sentiment mapping, and engagement auditing.
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="relative group min-w-[320px]">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent-teal rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
          <div className="relative glass-card flex items-center px-4 h-14">
            <Search className="text-text-muted mr-3" size={18} />
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!e.target.value.trim()) setActiveReport(null);
              }}
              placeholder="Search influencer..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-text-muted font-medium text-[15px]"
            />
            <button
              type="submit"
              className="bg-primary text-black font-black text-[13px] px-4 py-1.5 rounded-lg active:scale-95 transition-transform"
            >
              SEARCH
            </button>
          </div>
        </form>
      </motion.div>

      <div className="space-y-8">
        <AnimatePresence mode="wait">
          {!activeReport ? (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
             >
               {reports.map((report, idx) => (
                 <motion.div
                   key={report.id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: idx * 0.05 }}
                   whileHover={{ y: -5, scale: 1.02 }}
                   onClick={() => setActiveReport(report)}
                   className="glass-card p-6 cursor-pointer group relative overflow-hidden"
                 >
                   <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink size={16} className="text-primary" />
                   </div>
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center font-black text-primary text-xl border border-white/5">
                        {report.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-[16px] leading-tight">{report.name}</h3>
                        <p className="text-[13px] text-text-muted">@{report.id}</p>
                      </div>
                   </div>
                   <div className="flex flex-wrap gap-2 mb-4">
                      <Pill className="bg-white/5 text-white/60 border-none">{report.parsed?.primary_niche || "Lifestyle"}</Pill>
                      <Pill className="bg-primary/10 text-primary border-none">Tunisia</Pill>
                   </div>
                   <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest">CQS Score</span>
                        <span className="text-xl font-black text-accent-teal">{report.parsed?.cqs || "N/A"}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Audience</span>
                        <span className="text-[13px] font-bold text-white">{report.parsed?.followers ? formatFollowers(report.parsed.followers) : "N/A"}</span>
                      </div>
                   </div>
                 </motion.div>
               ))}
             </motion.div>
          ) : (
            <motion.div
              key={activeReport.id}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
            >
              {/* BACK BUTTON */}
              <button 
                onClick={() => setActiveReport(null)}
                className="text-[13px] font-bold text-primary flex items-center gap-2 hover:translate-x-[-4px] transition-transform mb-2"
              >
                ← Back to overview
              </button>

              {/* HERO GLASS CARD */}
              <div className="glass-card p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32"></div>
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                  <div className="flex items-start gap-8">
                    <motion.div 
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent-teal p-0.5"
                    >
                      <div className="w-full h-full rounded-[22px] bg-[#0A0A0B] flex items-center justify-center font-black text-3xl text-white">
                        {activeReport.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    </motion.div>
                    
                    <div className="space-y-3">
                      <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-1">
                          {activeReport.name}
                        </h2>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-text-muted">@{activeReport.id}</span>
                          <a href={`https://instagram.com/${activeReport.id}`} target="_blank" className="text-primary hover:text-white transition-colors">
                            <ExternalLink size={18} />
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Pill className="bg-primary/20 text-primary border border-primary/20">{p.primary_niche || "Lifestyle"}</Pill>
                        {p.secondary_niches?.slice(0, 2).map(n => (
                          <Pill key={n} className="bg-white/5 text-white/70 border border-white/10">{n}</Pill>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-2 text-text-secondary font-bold text-[14px]">
                          <Users size={16} className="text-primary" />
                          {p.followers ? formatFollowers(p.followers) : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-8 lg:gap-12 py-6 px-8 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">CQS Score</p>
                      <p className="text-3xl font-black text-accent-teal">{p.cqs || "0"}</p>
                      <div className="text-[10px] font-bold text-accent-teal/80 bg-accent-teal/10 rounded-full px-2 py-0.5">{p.audience_health || "Good"}</div>
                    </div>
                    <div className="text-center space-y-1 border-x border-white/5 px-8">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">NPS</p>
                      <p className="text-3xl font-black text-primary">{p.nps ? `+${p.nps}` : "0"}</p>
                      <div className="text-[10px] font-bold text-primary/80 bg-primary/10 rounded-full px-2 py-0.5">High Loyalty</div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Engagement</p>
                      <p className="text-3xl font-black text-accent-amber">{p.engagement_rate || "0"}%</p>
                      <div className="text-[10px] font-bold text-accent-amber/80 bg-accent-amber/10 rounded-full px-2 py-0.5">Top 5%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILED STATS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* SENTIMENT CARD */}
                {p.sentiment && (
                  <motion.div variants={containerVariants} className="glass-card p-6 lg:col-span-2">
                    <h3 className="text-[16px] font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      Sentiment Analysis
                    </h3>
                    <div className="grid grid-cols-3 gap-6 mb-8">
                      <div className="space-y-1">
                        <span className="text-[40px] font-black text-accent-teal leading-none">{p.sentiment.positive}%</span>
                        <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Positive</p>
                      </div>
                      <div className="space-y-1 border-x border-white/5 px-6">
                        <span className="text-[40px] font-black text-accent-amber leading-none">{p.sentiment.neutral}%</span>
                        <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Neutral</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[40px] font-black text-accent-coral leading-none">{p.sentiment.negative}%</span>
                        <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Negative</p>
                      </div>
                    </div>
                    <StackedBar
                      segments={[
                        { pct: p.sentiment.positive, color: "hsl(var(--accent-teal))" },
                        { pct: p.sentiment.neutral, color: "hsl(var(--accent-amber))" },
                        { pct: p.sentiment.negative, color: "hsl(var(--accent-coral))" },
                      ]}
                    />
                    <p className="mt-6 text-[13px] text-text-secondary leading-relaxed bg-white/5 p-4 rounded-xl italic">
                      "The community shows high alignment with brand values, with minimal toxicity detected in the last 1000 comments."
                    </p>
                  </motion.div>
                )}

                {/* LANGUAGES CARD */}
                <motion.div variants={containerVariants} className="glass-card p-6">
                  <h3 className="text-[16px] font-black text-white uppercase tracking-wider mb-6">Audience Languages</h3>
                  <div className="space-y-5">
                    {p.languages?.map((l, i) => (
                      <div key={l.name} className="space-y-2">
                        <div className="flex items-center justify-between text-[13px] font-bold">
                          <span className="text-white">{l.name}</span>
                          <span className="text-text-secondary">{l.pct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${l.pct}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* PERFORMANCE FORMATS */}
                {p.formats && (
                  <motion.div variants={containerVariants} className="glass-card p-6 lg:col-span-3">
                    <h3 className="text-[16px] font-black text-white uppercase tracking-wider mb-8">Format Performance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {p.formats.casual && (
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center justify-between mb-6">
                            <span className="text-[11px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-lg">Static Image</span>
                            <span className="text-[12px] font-bold text-text-muted">{p.formats.casual.count} posts</span>
                          </div>
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                              <span className="text-2xl font-black text-white">{p.formats.casual.likes.toLocaleString()}</span>
                              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Avg Likes</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-2xl font-black text-white">{p.formats.casual.comments}</span>
                              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Avg Comments</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {p.formats.reel && (
                        <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20 hover:border-primary/30 transition-colors relative">
                          <div className="absolute -top-3 right-6 bg-accent-teal text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg">WINNER</div>
                          <div className="flex items-center justify-between mb-6">
                            <span className="text-[11px] font-black uppercase tracking-widest bg-primary/20 text-primary px-3 py-1 rounded-lg">Short Video (Reels)</span>
                            <span className="text-[12px] font-bold text-primary/60">{p.formats.reel.count} posts</span>
                          </div>
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                              <span className="text-2xl font-black text-white">{p.formats.reel.likes.toLocaleString()}</span>
                              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Avg Likes</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-2xl font-black text-white">{p.formats.reel.comments}</span>
                              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Avg Comments</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Reports;
