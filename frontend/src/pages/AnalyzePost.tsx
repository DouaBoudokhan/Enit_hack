import { useState } from "react";
import { Card, CardHeader } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { AnimatedBar, StackedBar } from "@/components/Bars";
import { CountNumber } from "@/components/CountNumber";
import { Link2, MessageSquare, Heart, Eye, Sparkles, Send, Bookmark, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, filter: "blur(3px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 24 } }
};

import { useExport } from "@/context/ExportContext";

// ── Types ────────────────────────────────
interface Comment {
  id: string;
  text: string;
  ownerUsername: string;
  sentiment: string;
  language: string;
  quality_score: number;
  likesCount: number;
  repliesCount: number;
  toxicity_flag?: boolean;
}

interface PostAnalysis {
  post?: {
    post_id: string;
    post_url: string;
    media_type: string;
    display_url?: string;
    enriched_content: string;
    likes_count: number;
    comments_count: number;
  };
  influencer?: { name: string; handle: string };
  content_type?: string;
  sentiment?: {
    positive: number;
    neutral: number;
    negative: number;
    avg_quality: number;
    toxicity_rate: number;
    total_comments: number;
  };
  language_breakdown?: { language: string; count: number; percentage: number }[];
  context_insight?: string;
  comments?: Comment[];
  vision_used?: boolean;
  is_simulated?: boolean;
  error?: string;
}

// ── Sentiment color helpers ──────────────
const sentimentColor = (s: string) =>
  s === "positive" ? "text-teal" : s === "negative" ? "text-coral" : "text-amber";
const sentimentBg = (s: string) =>
  s === "positive"
    ? "bg-teal/10 border-teal/20"
    : s === "negative"
    ? "bg-coral/10 border-coral/20"
    : "bg-amber/10 border-amber/20";

export default function AnalyzePost() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PostAnalysis | null>(null);
  const [error, setError] = useState("");
  const { setPayload } = useExport();

  const fetchAnalysis = async (postId: string) => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_url: postId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Post not found");
      }
      const data: PostAnalysis = await res.json();
      if (data.error) {
        setError(data.error);
      }
      setResult(data);
      setPayload({ page: "analyze_post", postId, result: data });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    fetchAnalysis(url.trim());
  };

  const r = result;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">
          Post Intelligence Audit
        </h1>
        <p className="text-[15px] text-text-secondary max-w-lg leading-relaxed">
          Deep sentiment mapping and community quality analysis for any social media post.
        </p>
      </motion.div>

      {/* Search input */}
      <form onSubmit={onSubmit} className="relative group max-w-2xl">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent-teal rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
        <div className="relative glass-card flex items-center px-4 h-16">
          <Link2 className="text-text-muted mr-3" size={20} />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Instagram or TikTok URL..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-text-muted font-medium text-[16px]"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-black font-black text-[14px] px-6 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "PROCESSING..." : "ANALYZE"}
          </button>
        </div>
      </form>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-4 bg-accent-coral/10 border border-accent-coral/20 rounded-xl text-[14px] text-accent-coral font-bold flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-accent-coral animate-pulse" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="mt-12 flex flex-col items-center">
          <div className="relative mb-8">
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -inset-8 bg-primary/20 blur-[40px] rounded-full"
            />
            <div className="w-16 h-16 border-2 border-white/5 border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-[16px] font-bold text-white tracking-wide animate-pulse">
            Sarra is visiting the post & mapping community sentiment...
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-12 opacity-40 grayscale">
             <div className="glass-card h-64" />
             <div className="glass-card h-64" />
          </div>
        </div>
      )}

      {/* Warning if simulated */}
      <AnimatePresence>
        {r && r.is_simulated && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-accent-amber/10 border border-accent-amber/20 rounded-xl text-[13px] text-accent-amber font-bold flex items-center gap-3"
          >
            <Sparkles size={16} />
            <span>
              <strong>Note:</strong> Simulated analysis active. 
              <button onClick={() => fetchAnalysis(url)} className="ml-2 underline hover:text-white transition-colors">Retry Live</button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {r && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 flex flex-col lg:flex-row gap-10 items-start"
        >

          {/* LEFT: INSTAGRAM CLONE POST */}
          {r.post && (
            <div className="w-full lg:w-[420px] shrink-0 glass-card overflow-hidden sticky top-24">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-amber via-accent-coral to-primary p-[2px]">
                    <div className="w-full h-full rounded-full border-2 border-[#111112] overflow-hidden bg-white/5">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.influencer?.handle}`} 
                        alt="avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-white tracking-tight leading-none">
                      {r.influencer?.handle || "unknown"}
                    </span>
                    <span className="text-[11px] text-text-muted mt-1 flex items-center gap-1 font-bold">
                      <Sparkles size={10} className="text-primary" /> AUDIT ACTIVE
                    </span>
                  </div>
                </div>
                <MoreHorizontal size={20} className="text-text-muted" />
              </div>

              {/* Post Image/Video */}
              <div className="bg-white/5 min-h-[300px] flex items-center justify-center relative group">
                {r.post.display_url ? (
                  <img 
                    src={`http://localhost:8000/api/proxy-image?url=${encodeURIComponent(r.post.display_url)}`}
                    className="w-full h-auto object-cover max-h-[550px]" 
                    alt="Post content" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x500/161b22/58a6ff?text=${r.post?.media_type}+Post\\n(Image+URL+Expired)`;
                    }}
                  />
                ) : (
                  <div className="text-sm text-text-muted p-12 text-center font-bold">
                    [ VISUAL DATA UNAVAILABLE ]
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-black/60 text-white text-[11px] font-black px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-md border border-white/10 uppercase tracking-widest">
                  {r.post.media_type === "video" ? <><Eye size={12} /> REEL</> : "POST"}
                </div>
              </div>

              {/* Post Actions */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4 text-white">
                  <div className="flex items-center gap-5">
                    <Heart size={26} className="hover:text-accent-coral cursor-pointer transition-colors" />
                    <MessageSquare size={26} className="hover:text-primary cursor-pointer transition-colors" />
                    <Send size={26} className="hover:text-accent-teal cursor-pointer transition-colors" />
                  </div>
                  <Bookmark size={26} className="hover:text-accent-amber cursor-pointer transition-colors" />
                </div>
                <div className="text-[15px] font-black text-white mb-2 tracking-tight">
                  {(r.post.likes_count ?? 0).toLocaleString()} <span className="font-bold text-text-secondary text-[14px] ml-1">likes</span>
                </div>
                <div className="text-[14px] text-white leading-relaxed mb-4">
                  <span className="font-black mr-2">{r.influencer?.handle || "unknown"}</span>
                  <span className="text-text-secondary font-medium">{r.post.enriched_content}</span>
                </div>
                <div className="text-[13px] font-bold text-primary cursor-pointer hover:text-white transition-colors">
                  View all {(r.post.comments_count ?? 0).toLocaleString()} comments
                </div>
              </div>
            </div>
          )}

          {/* RIGHT: ANALYSIS COL */}
          <div className="flex flex-col flex-1 gap-6 min-w-0">
            {/* Sentiment breakdown */}
            {r.sentiment && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-8">
                <h3 className="text-[16px] font-black text-white uppercase tracking-wider mb-8 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-teal animate-pulse" />
                  Sentiment Breakdown
                </h3>
                
                <div className="grid grid-cols-3 gap-8 mb-10">
                  <div className="space-y-1">
                    <span className="text-4xl font-black text-accent-teal leading-none">{r.sentiment.positive}%</span>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Positive</p>
                  </div>
                  <div className="space-y-1 border-x border-white/5 px-8">
                    <span className="text-4xl font-black text-accent-amber leading-none">{r.sentiment.neutral}%</span>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Neutral</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-4xl font-black text-accent-coral leading-none">{r.sentiment.negative}%</span>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Negative</p>
                  </div>
                </div>
                
                <StackedBar
                  segments={[
                    { pct: r.sentiment.positive, color: "hsl(var(--accent-teal))" },
                    { pct: r.sentiment.neutral, color: "hsl(var(--accent-amber))" },
                    { pct: r.sentiment.negative, color: "hsl(var(--accent-coral))" },
                  ]}
                />

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Avg Quality</p>
                    <p className="text-2xl font-black text-white">{r.sentiment.avg_quality}<span className="text-[14px] text-text-muted ml-1">/ 10</span></p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Toxicity</p>
                    <p className="text-2xl font-black text-accent-coral">{r.sentiment.toxicity_rate}%</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Language breakdown */}
            {r.language_breakdown && r.language_breakdown.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8">
                <h3 className="text-[16px] font-black text-white uppercase tracking-wider mb-8">Audience Linguistics</h3>
                <div className="space-y-6">
                  {r.language_breakdown.map((l, i) => (
                    <div key={l.language} className="space-y-2">
                      <div className="flex items-center justify-between text-[13px] font-bold">
                        <span className="text-white uppercase tracking-wider">{l.language}</span>
                        <span className="text-text-secondary">{l.percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${l.percentage}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Individual comments */}
            {r.comments && r.comments.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-8">
                <h3 className="text-[16px] font-black text-white uppercase tracking-wider mb-8">Notable Comments</h3>
                <div className="space-y-4">
                  {r.comments.map((c, idx) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`rounded-2xl p-6 border-l-4 transition-all hover:translate-x-1 ${
                        c.sentiment === "positive" ? "bg-accent-teal/5 border-accent-teal" : 
                        c.sentiment === "negative" ? "bg-accent-coral/5 border-accent-coral" : 
                        "bg-white/5 border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[14px] font-black text-white">@{c.ownerUsername}</span>
                          <Pill className={`border-none ${
                            c.sentiment === "positive" ? "bg-accent-teal text-black" : 
                            c.sentiment === "negative" ? "bg-accent-coral text-white" : 
                            "bg-white/20 text-white"
                          }`}>
                            {c.sentiment}
                          </Pill>
                          {c.toxicity_flag && (
                            <span className="text-[10px] font-black text-accent-coral px-2 py-1 bg-accent-coral/10 rounded-lg uppercase tracking-widest">⚠ TOXIC</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[12px] font-black text-text-muted">
                           <span className="flex items-center gap-1"><Heart size={14} className="text-accent-coral" /> {c.likesCount || 0}</span>
                           <span className="text-white">QUALITY: {c.quality_score}</span>
                        </div>
                      </div>
                      <p className="text-[15px] text-text-secondary leading-relaxed font-medium" dir="auto">
                        {c.text}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!r && !loading && !error && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="mt-12 glass-card p-20 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 blur-[120px] -z-10" />
          <div className="mx-auto w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-8 border border-white/10">
            <Link2 className="text-primary" size={32} />
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight mb-3">Ready for Audit</h3>
          <p className="text-text-secondary max-w-sm mx-auto font-medium">
            Paste a link above to start Sarra's intelligence gathering process on any post.
          </p>
        </motion.div>
      )}
    </div>
  );
}
