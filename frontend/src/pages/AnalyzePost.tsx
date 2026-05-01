import { useState } from "react";
import { Card, CardHeader } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { AnimatedBar, StackedBar } from "@/components/Bars";
import { CountNumber } from "@/components/CountNumber";
import { Link2, MessageSquare, Heart, Eye, Sparkles } from "lucide-react";

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
        <div className="mt-8 flex flex-col gap-4 animate-fade-in">

          {/* Post info card */}
          {r.post && (
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Pill
                      tone={r.post.media_type === "video" ? "purple" : "blue"}
                      size="sm"
                    >
                      {r.post.media_type === "video" ? "REEL" : "IMAGE"}
                    </Pill>
                    <Pill size="sm">{r.content_type}</Pill>
                    {r.vision_used && (
                      <Pill tone="teal" size="sm" className="bg-teal/10">
                        <Sparkles size={10} className="mr-1" /> Vision AI
                      </Pill>
                    )}
                  </div>
                  <div className="text-[15px] font-medium text-ink mb-1">
                    {r.influencer?.name || "Unknown"}
                    <span className="text-ink-muted font-normal ml-1.5">
                      @{r.influencer?.handle || "unknown"}
                    </span>
                  </div>
                  <p className="text-[13px] text-ink-secondary leading-relaxed max-w-2xl">
                    {r.post.enriched_content}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 mt-4 text-[13px] text-ink-secondary">
                <span className="flex items-center gap-1.5">
                  <Heart size={14} className="text-coral" /> {(r.post.likes_count ?? 0).toLocaleString()} likes
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-blue" /> {(r.post.comments_count ?? 0).toLocaleString()} comments
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye size={14} className="text-ink-muted" /> {r.sentiment?.total_comments ?? 0} analyzed
                </span>
              </div>
            </Card>
          )}

          {/* Sentiment breakdown */}
          {r.sentiment && (
            <Card noPadding>
              <CardHeader
                title="Comment sentiment analysis"
                subtitle={`Analyzing ${r.sentiment.total_comments} comments on this ${r.post?.media_type === "video" ? "reel" : "post"}`}
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

          {/* Context insight */}
          {r.context_insight && (
            <Card noPadding>
              <CardHeader title="Why this sentiment?" />
              <div className="p-5">
                <div className="flex items-start gap-3 bg-primary/5 border border-primary/10 rounded-[10px] p-4">
                  <Sparkles size={18} className="text-primary mt-0.5 shrink-0" />
                  <p className="text-[13px] text-ink-secondary leading-relaxed">
                    {r.context_insight}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Language breakdown */}
          {r.language_breakdown && r.language_breakdown.length > 0 && (
            <Card noPadding>
              <CardHeader title="Comment languages" />
              <div className="p-5 flex flex-col gap-3">
                {r.language_breakdown.map((l, i) => (
                  <div key={l.language} className="flex items-center gap-4">
                    <div className="w-20 shrink-0 text-[13px] text-ink-secondary">
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
                      {l.percentage}% ({l.count})
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
                title="Comment details"
                subtitle="Each comment with sentiment, language, and quality score"
              />
              <div className="p-5 flex flex-col gap-2.5">
                {r.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-[10px] border p-3 ${sentimentBg(c.sentiment)}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-ink">
                          @{c.ownerUsername}
                        </span>
                        <Pill size="sm" tone={c.sentiment === "positive" ? "teal" : c.sentiment === "negative" ? "neutral" : "neutral"}>
                          {c.sentiment}
                        </Pill>
                        <span className="text-[10px] text-ink-muted px-1.5 py-0.5 bg-surface-input rounded">
                          {c.language}
                        </span>
                        {c.toxicity_flag && (
                          <span className="text-[10px] text-coral px-1.5 py-0.5 bg-coral/10 rounded border border-coral/20">
                            ⚠ toxic
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                        <span>Quality: <strong className={sentimentColor(c.sentiment)}>{c.quality_score}/10</strong></span>
                        <span>❤️ {c.likesCount}</span>
                      </div>
                    </div>
                    <p className="text-[13px] text-ink leading-relaxed" dir="auto">
                      {c.text}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
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
