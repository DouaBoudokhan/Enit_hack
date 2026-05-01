import { useState } from "react";
import { Card, CardHeader } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { AnimatedBar, StackedBar } from "@/components/Bars";
import { CountNumber } from "@/components/CountNumber";
import { Link2, MessageSquare, Heart, Eye, Sparkles, Send, Bookmark, MoreHorizontal, CheckCircle2 } from "lucide-react";

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
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink tracking-tight-2">
          Analyze a Post
        </h1>
        <p className="text-[14px] text-ink-secondary mt-1">
          Paste a post or reel URL to analyze comment sentiment &amp; community quality
        </p>
      </div>

      {/* Search input */}
      <form onSubmit={onSubmit}>
        <div className="relative bg-surface border border-line-strong/80 rounded-[10px] h-12 flex items-center px-4 transition-shadow focus-within:border-primary focus-within:shadow-[0_0_0_3px_hsl(var(--accent-purple)/0.1)]">
          <Link2 size={16} className="text-ink-muted mr-2" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste an Instagram or TikTok URL…"
            className="flex-1 bg-transparent outline-none text-[14px] text-ink placeholder:text-ink-muted"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary-strong text-primary-foreground text-[14px] font-medium h-8 px-4 rounded-lg transition-colors duration-150 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Analyze →"}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-coral/10 border border-coral/20 rounded-[10px] text-[13px] text-coral">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="spinner" />
            <span className="text-[14px] text-ink-secondary">
              AI agent is visiting the post &amp; analyzing…
            </span>
          </div>
          <div className="space-y-4">
            <div className="bg-surface rounded-[10px] shadow-card p-5">
              <div className="skeleton h-4 w-48 mb-3" />
              <div className="skeleton h-20 w-full" />
            </div>
            <div className="bg-surface rounded-[10px] shadow-card p-5">
              <div className="skeleton h-4 w-32 mb-3" />
              <div className="skeleton h-6 w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Warning if simulated */}
      {r && r.is_simulated && (
        <div className="mt-4 p-3 bg-amber/10 border border-amber/20 rounded-[10px] text-[13px] text-amber flex items-center gap-2">
          <Sparkles size={16} />
          <span>
            <strong>Note:</strong> Instagram limited live access. Analysis is currently simulated based on URL context.
            <button onClick={() => fetchAnalysis(url)} className="ml-2 underline font-medium">Try again</button>
          </span>
        </div>
      )}

      {/* Results */}
      {r && !loading && (
        <div className="mt-8 flex flex-col lg:flex-row gap-8 items-start animate-fade-in">

          {/* LEFT: INSTAGRAM CLONE POST */}
          {r.post && (
            <div className="w-full lg:w-[400px] shrink-0 bg-white border border-line-strong/30 rounded-[12px] overflow-hidden sticky top-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:bg-[#121212] dark:border-white/10">
              {/* Post Header */}
              <div className="flex items-center justify-between p-3 border-b border-line dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-tr from-amber-400 via-coral to-purple-500 p-[2px]">
                    <div className="w-full h-full rounded-full border-[2px] border-white dark:border-[#121212] overflow-hidden bg-surface">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.influencer?.handle}`} 
                        alt="avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-semibold text-ink leading-tight flex items-center gap-1">
                      {r.influencer?.handle || "unknown"}
                    </span>
                    {r.vision_used && (
                      <span className="text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                        <Sparkles size={10} className="text-secondary" /> AI Simulated
                      </span>
                    )}
                  </div>
                </div>
                <MoreHorizontal size={20} className="text-ink-muted" />
              </div>

              {/* Post Image/Video */}
              <div className="bg-surface-input min-h-[300px] flex items-center justify-center relative">
                {r.post.display_url ? (
                  <img 
                    src={`http://localhost:8000/api/proxy-image?url=${encodeURIComponent(r.post.display_url)}`}
                    className="w-full h-auto object-cover max-h-[500px]" 
                    alt="Post content" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x500/161b22/58a6ff?text=${r.post?.media_type}+Post\\n(Image+URL+Expired)`;
                    }}
                  />
                ) : (
                  <div className="text-sm text-ink-muted p-12 text-center">
                    No visual available for {r.post.media_type || "post"}
                  </div>
                )}
                {r.post.media_type === "video" && (
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg> 
                    REEL
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="p-3.5">
                <div className="flex items-center justify-between mb-3 text-ink">
                  <div className="flex items-center gap-3.5">
                    <Heart size={24} className="hover:opacity-50 cursor-pointer transition-opacity" />
                    <MessageSquare size={24} className="hover:opacity-50 cursor-pointer transition-opacity" />
                    <Send size={24} className="hover:opacity-50 cursor-pointer transition-opacity" />
                  </div>
                  <Bookmark size={24} className="hover:opacity-50 cursor-pointer transition-opacity" />
                </div>
                <div className="text-[13.5px] font-semibold text-ink mb-1.5">
                  {(r.post.likes_count ?? 0).toLocaleString()} likes
                </div>
                <div className="text-[13.5px] text-ink leading-[1.4] mb-2.5">
                  <span className="font-semibold mr-1.5">{r.influencer?.handle || "unknown"}</span>
                  <span className="whitespace-pre-wrap">{r.post.enriched_content}</span>
                </div>
                <div className="text-[13.5px] text-ink-muted cursor-pointer hover:underline">
                  View all {(r.post.comments_count ?? 0).toLocaleString()} comments
                </div>
              </div>
            </div>
          )}

          {/* RIGHT: ANALYSIS COL */}
          <div className="flex flex-col flex-1 gap-5 min-w-0">
            {/* Quick summary card */}
            <div className="bg-primary/5 border border-primary/20 rounded-[12px] p-5">
               <div className="flex items-center gap-2 mb-3">
                 <Sparkles className="text-primary w-5 h-5" />
                 <h3 className="font-semibold text-ink text-[16px]">AI Comment Analysis</h3>
               </div>
               <p className="text-[14px] text-ink-secondary leading-relaxed">
                 We analyzed <strong className="text-ink font-medium">{r.sentiment?.total_comments} comments</strong> on this {r.content_type?.toLowerCase() || 'post'}. 
                 {r.context_insight && ` ${r.context_insight}`}
               </p>
            </div>

            {/* Sentiment breakdown */}
            {r.sentiment && (
              <Card noPadding>
                <CardHeader
                  title="Sentiment Breakdown"
                  subtitle="How the community feels about this content"
                />
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-background rounded-[10px] p-4 border-t-[3px]" style={{ borderTopColor: "hsl(var(--accent-teal))" }}>
                      <div className="text-[28px] metric-num text-teal">
                        <CountNumber value={r.sentiment.positive} suffix="%" />
                      </div>
                      <div className="text-[12px] text-ink-secondary mt-1">Positive</div>
                    </div>
                    <div className="bg-background rounded-[10px] p-4 border-t-[3px]" style={{ borderTopColor: "hsl(var(--accent-amber))" }}>
                      <div className="text-[28px] metric-num text-amber">
                        <CountNumber value={r.sentiment.neutral} suffix="%" />
                      </div>
                      <div className="text-[12px] text-ink-secondary mt-1">Neutral</div>
                    </div>
                    <div className="bg-background rounded-[10px] p-4 border-t-[3px]" style={{ borderTopColor: "hsl(var(--accent-coral))" }}>
                      <div className="text-[28px] metric-num text-coral">
                        <CountNumber value={r.sentiment.negative} suffix="%" />
                      </div>
                      <div className="text-[12px] text-ink-secondary mt-1">Negative</div>
                    </div>
                  </div>
                  <StackedBar
                    segments={[
                      { pct: r.sentiment.positive, color: "hsl(var(--accent-teal))" },
                      { pct: r.sentiment.neutral, color: "hsl(var(--accent-amber))" },
                      { pct: r.sentiment.negative, color: "hsl(var(--accent-coral))" },
                    ]}
                  />

                  {/* Quality metrics */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-background rounded-[10px] p-3">
                      <div className="text-[11px] text-ink-muted">Avg quality score</div>
                      <div className="text-[18px] font-semibold text-ink mt-0.5">
                        {r.sentiment.avg_quality} / 10
                      </div>
                    </div>
                    <div className="bg-background rounded-[10px] p-3">
                      <div className="text-[11px] text-ink-muted">Toxicity rate</div>
                      <div className="text-[18px] font-semibold text-ink mt-0.5">
                        {r.sentiment.toxicity_rate}%
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Language breakdown */}
            {r.language_breakdown && r.language_breakdown.length > 0 && (
              <Card noPadding>
                <CardHeader title="Audience Linguistics" subtitle="Languages spoken in the comment section" />
                <div className="p-5 flex flex-col gap-3">
                  {r.language_breakdown.map((l, i) => (
                    <div key={l.language} className="flex items-center gap-4">
                      <div className="w-24 shrink-0 text-[13px] font-medium text-ink">
                        {l.language}
                      </div>
                      <div className="flex-1">
                        <AnimatedBar
                          pct={l.percentage}
                          color="hsl(var(--accent-purple))"
                          opacity={1 - i * 0.15}
                          delay={i * 80}
                        />
                      </div>
                      <div className="w-16 text-right text-[13px] text-ink-secondary tabular-nums">
                        {l.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Individual comments */}
            {r.comments && r.comments.length > 0 && (
              <Card noPadding>
                <CardHeader
                  title="Notable Comments"
                  subtitle="Sample comments with sentiment and quality scores"
                />
                <div className="p-5 flex flex-col gap-3">
                  {r.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-[10px] border p-4 ${sentimentBg(c.sentiment)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[13px] font-semibold text-ink">
                            @{c.ownerUsername}
                          </span>
                          <Pill size="sm" tone={c.sentiment === "positive" ? "teal" : c.sentiment === "negative" ? "coral" : "neutral"}>
                            {c.sentiment}
                          </Pill>
                          <span className="text-[11px] text-ink-muted px-1.5 py-0.5 bg-surface-input rounded border border-line">
                            {c.language}
                          </span>
                          {c.toxicity_flag && (
                            <span className="text-[11px] font-medium text-coral px-1.5 py-0.5 bg-coral/10 rounded border border-coral/20">
                              ⚠ toxic
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[12px] font-medium text-ink-muted">
                          <span>Score: <strong className={sentimentColor(c.sentiment)}>{c.quality_score}/10</strong></span>
                          <span className="flex items-center gap-1"><Heart size={12} /> {c.likesCount || 0}</span>
                        </div>
                      </div>
                      <p className="text-[14px] text-ink leading-relaxed" dir="auto">
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!r && !loading && !error && (
        <Card className="mt-6 text-center py-12">
          <div className="text-[14px] text-ink-secondary">
            Paste any Instagram or TikTok post URL above to analyze comment sentiment &amp; community quality.
          </div>
        </Card>
      )}
    </div>
  );
}
